using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Reservations;
using MediatR;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Application.Features.Reservations.ExpireReservations;

public sealed record ProcessExpiredReservationsCommand(int BatchSize = 50) : IRequest<ExpiryBatchResult>;

public sealed record ExpiryBatchResult(
    int Inspected,
    int Cancelled,
    int Skipped,
    int Failed);

/// <summary>
/// Procesa reservas pendientes vencidas conforme a Spec 003 (RF-1-RF-20) y 010/RF-19:
/// cancela a los 15 min sin pago iniciado o a los 20 min con pago en curso no validado,
/// libera cupos una sola vez y registra la acción exacta <c>reservation.auto_cancelled</c>.
/// </summary>
public sealed class ProcessExpiredReservationsCommandHandler
    : IRequestHandler<ProcessExpiredReservationsCommand, ExpiryBatchResult>
{
    private readonly IReservationRepository _reservations;
    private readonly IPaymentRepository _payments;
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;
    private readonly ILogger<ProcessExpiredReservationsCommandHandler> _logger;

    public ProcessExpiredReservationsCommandHandler(
        IReservationRepository reservations,
        IPaymentRepository payments,
        IOfferRepository offers,
        IHotelRepository hotels,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit,
        ILogger<ProcessExpiredReservationsCommandHandler> logger)
    {
        _reservations = reservations;
        _payments = payments;
        _offers = offers;
        _hotels = hotels;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
        _logger = logger;
    }

    public async Task<ExpiryBatchResult> Handle(
        ProcessExpiredReservationsCommand request,
        CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var batchSize = Math.Clamp(request.BatchSize, 1, 200);
        var candidates = await _reservations.GetPendingExpiredCandidatesAsync(now, batchSize, cancellationToken);

        var cancelled = 0;
        var skipped = 0;
        var failed = 0;

        foreach (var reservation in candidates)
        {
            var hasTimelyPayment = await _payments.HasTimelyPaymentInProgressAsync(
                reservation.Id,
                reservation.PaymentDeadlineAtUtc,
                cancellationToken);

            if (!reservation.IsExpiredAt(now, hasTimelyPayment))
            {
                skipped++;
                continue;
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

            if (!reservation.TryCancelByExpiry(now))
            {
                skipped++;
                continue;
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

            var deadlineType = Reservation.GetApplicableDeadlineType(hasTimelyPayment);

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
                    cancellationOrigin = CancellationOrigin.Expiry.ToString().ToLowerInvariant(),
                    deadlineType,
                    releasedSeats
                })));

            try
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                cancelled++;
            }
            catch (ConcurrencyConflictAppException)
            {
                // Otra operación concurrente (pago o cancelación) modificó la reserva primero.
                skipped++;
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogError(
                    ex,
                    "Error al cancelar por vencimiento la reserva {ReservationId} ({ReservationNumber}).",
                    reservation.PublicId,
                    reservation.ReservationNumber);
            }
        }

        return new ExpiryBatchResult(candidates.Count, cancelled, skipped, failed);
    }
}
