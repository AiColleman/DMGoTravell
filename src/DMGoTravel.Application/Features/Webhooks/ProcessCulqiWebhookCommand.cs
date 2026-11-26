using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Payments.Refunds;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using MediatR;

namespace DMGoTravel.Application.Features.Webhooks;

public sealed record ProcessCulqiWebhookCommand(
    string RawBody,
    string? SignatureHeader,
    string? EventId,
    string? EventType,
    string? Reference,
    decimal? Amount,
    string? Currency) : IRequest<WebhookAckDto>;

public sealed class ProcessCulqiWebhookCommandHandler : IRequestHandler<ProcessCulqiWebhookCommand, WebhookAckDto>
{
    private readonly IWebhookSignatureVerifier _signatureVerifier;
    private readonly IWebhookEventRepository _webhookEvents;
    private readonly IPaymentRepository _payments;
    private readonly IReservationRepository _reservations;
    private readonly IRefundRepository _refunds;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public ProcessCulqiWebhookCommandHandler(
        IWebhookSignatureVerifier signatureVerifier,
        IWebhookEventRepository webhookEvents,
        IPaymentRepository payments,
        IReservationRepository reservations,
        IRefundRepository refunds,
        IOfferRepository offers,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _signatureVerifier = signatureVerifier;
        _webhookEvents = webhookEvents;
        _payments = payments;
        _reservations = reservations;
        _refunds = refunds;
        _offers = offers;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<WebhookAckDto> Handle(ProcessCulqiWebhookCommand request, CancellationToken cancellationToken)
    {
        if (!_signatureVerifier.VerifyCulqiSignature(request.RawBody, request.SignatureHeader))
        {
            throw new UnauthorizedAppException("Firma de webhook Culqi inválida o ausente.");
        }

        if (string.IsNullOrWhiteSpace(request.EventId) || string.IsNullOrWhiteSpace(request.EventType))
        {
            throw new ValidationAppException([
                new FieldError("id", "El evento Culqi requiere 'id' y 'type'.")
            ]);
        }

        var eventId = request.EventId.Trim();
        var eventType = request.EventType.Trim().ToLowerInvariant();
        if (await _webhookEvents.ExistsAsync("culqi", eventId, cancellationToken))
        {
            return new WebhookAckDto(Received: true, Duplicate: true);
        }

        var now = _clock.UtcNow;
        await _webhookEvents.AddAsync(ProcessedWebhookEvent.Create("culqi", eventId, eventType, now), cancellationToken);

        var entityId = eventId;
        var entityType = "webhook_culqi";
        var reference = request.Reference?.Trim();

        if (!string.IsNullOrWhiteSpace(reference))
        {
            if (eventType is "payment.succeeded" or "charge.succeeded")
            {
                var attempt = await _payments.GetByProviderRequestRefAsync(reference, cancellationToken);
                if (attempt is not null)
                {
                    entityType = "payment_attempt";
                    entityId = attempt.PublicId.ToString();

                    if (attempt.Status is PaymentStatus.Created or PaymentStatus.Sent or PaymentStatus.Unknown)
                    {
                        attempt.MarkApproved();
                    }

                    var external = await _payments.GetExternalByProviderTransactionIdAsync(reference, cancellationToken);
                    if (external is null)
                    {
                        external = new ExternalPayment(
                            reference,
                            attempt.Id,
                            attempt.ReservationId,
                            request.Amount.HasValue && request.Amount.Value > 0 ? Money.Create(request.Amount.Value) : attempt.Amount,
                            "approved",
                            now,
                            "culqi");
                        await _payments.AddExternalAsync(external, cancellationToken);
                    }

                    var reservation = await _reservations.GetByIdAsync(attempt.ReservationId, cancellationToken);
                    if (reservation is not null)
                    {
                        if (reservation.Status == ReservationStatus.Pending && now < reservation.ValidationDeadlineAtUtc)
                        {
                            reservation.ConfirmPayment(now);
                        }
                        else if (reservation.Status == ReservationStatus.Cancelled)
                        {
                            // Cobro tardío sobre reserva ya cancelada (002/003): nunca reactiva; abre devolución.
                            await _unitOfWork.SaveChangesAsync(cancellationToken);
                            var existingRefund = await _refunds.GetByExternalPaymentIdAsync(external.Id, cancellationToken);
                            if (existingRefund is null)
                            {
                                await _refunds.AddAsync(
                                    RefundCase.Open(
                                        reservation.Id,
                                        attempt.Id,
                                        external.Id,
                                        external.Amount,
                                        "Cobro tardío recibido tras cancelación de la reserva.",
                                        "culqi",
                                        now),
                                    cancellationToken);
                            }
                        }
                    }
                }
            }
            else if (eventType is "payment.failed" or "charge.failed")
            {
                var attempt = await _payments.GetByProviderRequestRefAsync(reference, cancellationToken);
                if (attempt is not null)
                {
                    entityType = "payment_attempt";
                    entityId = attempt.PublicId.ToString();
                    if (attempt.Status is PaymentStatus.Created or PaymentStatus.Sent or PaymentStatus.Unknown)
                    {
                        attempt.MarkRejected();
                    }

                    await TryCancelAfterDefinitiveRejectionAsync(attempt, now, cancellationToken);
                }
            }
            else if (eventType is "refund.succeeded")
            {
                var refund = await _refunds.GetByProviderRefundIdAsync(reference, cancellationToken);
                if (refund is null)
                {
                    var ext = await _payments.GetExternalByProviderTransactionIdAsync(reference, cancellationToken);
                    if (ext is not null)
                    {
                        refund = await _refunds.GetByExternalPaymentIdAsync(ext.Id, cancellationToken);
                    }
                }

                if (refund is not null)
                {
                    entityType = "refund_case";
                    entityId = refund.PublicId.ToString();
                    refund.MarkExecuted(reference, now, JsonSerializer.Serialize(new { provider = "culqi", eventId, eventType }));
                }
            }
            else if (eventType is "refund.failed")
            {
                var refund = await _refunds.GetByProviderRefundIdAsync(reference, cancellationToken);
                if (refund is not null && refund.Status != RefundCase.StatusExecuted)
                {
                    entityType = "refund_case";
                    entityId = refund.PublicId.ToString();
                    refund.MarkFailed("Devolución rechazada según webhook Culqi.", now, JsonSerializer.Serialize(new { provider = "culqi", eventId, eventType }));
                }
            }
        }

        _audit.Record(new AuditEntry(
            AuditActions.WebhookCulqiProcessed,
            AuditActions.WebhookCulqiProcessed,
            AuditActions.ActorSystem,
            null,
            entityType,
            entityId,
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                provider = "culqi",
                providerReference = reference
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new WebhookAckDto(Received: true, Duplicate: false);
    }

    /// <summary>
    /// Aplica 001/RF-86 y 002/RF-19: un rechazo definitivo validado dentro de
    /// los cinco minutos de tolerancia cancela de inmediato y libera una sola vez.
    /// </summary>
    private async Task TryCancelAfterDefinitiveRejectionAsync(
        PaymentAttempt attempt,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (attempt.Status != PaymentStatus.Rejected)
        {
            return;
        }

        var reservation = await _reservations.GetByIdAsync(attempt.ReservationId, cancellationToken);
        if (reservation is null || reservation.Status != ReservationStatus.Pending)
        {
            return;
        }

        if (now < reservation.PaymentDeadlineAtUtc || now >= reservation.ValidationDeadlineAtUtc)
        {
            return;
        }

        // Sin intento iniciado a tiempo no hay tolerancia: el vencimiento lo resuelve.
        if (attempt.CreatedAtUtc >= reservation.PaymentDeadlineAtUtc)
        {
            return;
        }

        var releasedSeats = reservation.Holds
            .Where(hold => hold.IsHeld && string.Equals(hold.ResourceType, "departure", StringComparison.Ordinal))
            .Sum(hold => hold.Quantity);

        var heldHotelNights = reservation.Holds
            .Where(hold => hold.IsHeld &&
                           string.Equals(hold.ResourceType, "room_night", StringComparison.Ordinal) &&
                           hold.PeriodDate.HasValue)
            .Select(hold => (hold.ResourceId, StayDate: hold.PeriodDate!.Value, hold.Quantity))
            .ToList();

        if (!reservation.TryCancelByPaymentRejection(now))
        {
            return;
        }

        if (releasedSeats > 0)
        {
            var departure = await _offers.GetDepartureByIdAsync(reservation.DepartureId, cancellationToken);
            departure?.ReleaseSeats(releasedSeats);
        }

        foreach (var held in heldHotelNights)
        {
            var night = await _hotels.GetInventoryNightAsync(held.ResourceId, held.StayDate, cancellationToken);
            night?.ReleaseRoom(held.Quantity);
        }

        _audit.Record(new AuditEntry(
            AuditActions.ReservationAutoCancelled,
            AuditActions.ReservationAutoCancelled,
            AuditActions.ActorSystem,
            null,
            "reservation",
            reservation.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                reservationNumber = reservation.ReservationNumber,
                previousStatus = ReservationStatus.Pending.ToString().ToLowerInvariant(),
                status = reservation.Status.ToString().ToLowerInvariant(),
                cancellationOrigin = CancellationOrigin.PaymentReject.ToString().ToLowerInvariant(),
                deadlineType = "validation_deadline",
                paymentStatus = PaymentStatus.Rejected.ToString().ToLowerInvariant(),
                releasedSeats
            })));
    }
}
