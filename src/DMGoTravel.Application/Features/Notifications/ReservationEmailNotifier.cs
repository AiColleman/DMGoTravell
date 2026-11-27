using System.Globalization;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Notifications;
using DMGoTravel.Domain.Modules.Reservations;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Application.Features.Notifications;

public interface IReservationEmailNotifier
{
    Task NotifyReservationCreatedAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        CancellationToken cancellationToken = default);

    Task NotifyReservationConfirmedAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        string? paymentReference,
        CancellationToken cancellationToken = default);

    Task NotifyReservationCompletedAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        CancellationToken cancellationToken = default);

    Task NotifyReservationCancelledByClientAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        CancellationToken cancellationToken = default);

    Task NotifyReservationCancelledByAdminAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        string reason,
        bool refundOpened,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Despacha correos reales vía Resend para todo el ciclo de vida de una reserva
/// (creación, confirmación por pago, finalización y cancelación) y registra cada
/// envío en el Outbox de notificaciones (Spec 004) sin comprometer la transacción principal.
/// </summary>
public sealed class ReservationEmailNotifier : IReservationEmailNotifier
{
    private readonly IEmailSender _emailSender;
    private readonly INotificationRepository _notifications;
    private readonly IDateTimeProvider _clock;
    private readonly ICorrelationContext _correlation;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ReservationEmailNotifier> _logger;

    public ReservationEmailNotifier(
        IEmailSender emailSender,
        INotificationRepository notifications,
        IDateTimeProvider clock,
        ICorrelationContext correlation,
        IUnitOfWork unitOfWork,
        ILogger<ReservationEmailNotifier> logger)
    {
        _emailSender = emailSender;
        _notifications = notifications;
        _clock = clock;
        _correlation = correlation;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public Task NotifyReservationCreatedAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        CancellationToken cancellationToken = default)
    {
        var greeting = BuildGreeting(fullName);
        var details = BuildReservationDetailsLines(reservation);
        var checkoutUrl = $"{_emailSender.FrontendBaseUrl}/checkout/{reservation.PublicId}";

        var body =
            $"{greeting}\n" +
            $"Hemos reservado temporalmente tus cupos por 15 minutos mientras completas el pago seguro.\n" +
            $"{details}\n" +
            $"Importante: completa tu pago antes de que expire la ventana de 15 minutos para confirmar definitivamente tu viaje.";

        return DispatchSafeAsync(
            template: "reservation.created",
            recipientEmail: recipientEmail,
            subject: $"Reserva #{reservation.ReservationNumber} registrada — Pendiente de pago",
            bodyText: body,
            idempotencyKey: $"res-created-{reservation.PublicId:N}",
            actionUrl: checkoutUrl,
            actionLabel: "Ir a pagar mi reserva",
            highlightCode: reservation.ReservationNumber,
            cancellationToken: cancellationToken);
    }

    public Task NotifyReservationConfirmedAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        string? paymentReference,
        CancellationToken cancellationToken = default)
    {
        var greeting = BuildGreeting(fullName);
        var details = BuildReservationDetailsLines(reservation);
        var accountUrl = $"{_emailSender.FrontendBaseUrl}/cuenta";
        var refLine = string.IsNullOrWhiteSpace(paymentReference)
            ? string.Empty
            : $"\nReferencia de pago aprobado: {paymentReference}";

        var body =
            $"{greeting}\n" +
            $"¡Tu pago fue verificado con éxito y tu reserva en DM GO TRAVEL ya está CONFIRMADA!\n" +
            $"{details}{refLine}\n" +
            $"Nuestro equipo en Ayacucho te espera puntualmente en la fecha programada.";

        return DispatchSafeAsync(
            template: "reservation.confirmed",
            recipientEmail: recipientEmail,
            subject: $"¡Reserva confirmada! #{reservation.ReservationNumber} — DM GO TRAVEL",
            bodyText: body,
            idempotencyKey: $"res-confirmed-{reservation.PublicId:N}",
            actionUrl: accountUrl,
            actionLabel: "Ver mi reserva confirmada",
            highlightCode: reservation.ReservationNumber,
            cancellationToken: cancellationToken);
    }

    public Task NotifyReservationCompletedAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        CancellationToken cancellationToken = default)
    {
        var greeting = BuildGreeting(fullName);
        var details = BuildReservationDetailsLines(reservation);
        var toursUrl = $"{_emailSender.FrontendBaseUrl}/tours";

        var body =
            $"{greeting}\n" +
            $"Tu reserva #{reservation.ReservationNumber} ha sido marcada como FINALIZADA tras concluir satisfactoriamente todos los servicios contratados.\n" +
            $"{details}\n" +
            $"¡Gracias por vivir el Perú junto a DM GO TRAVEL! Será un gusto recibirte nuevamente en tu próxima aventura.";

        return DispatchSafeAsync(
            template: "reservation.completed",
            recipientEmail: recipientEmail,
            subject: $"¡Viaje finalizado! Reserva #{reservation.ReservationNumber} — Gracias por viajar con DM GO TRAVEL",
            bodyText: body,
            idempotencyKey: $"res-completed-{reservation.PublicId:N}",
            actionUrl: toursUrl,
            actionLabel: "Explorar próximas experiencias",
            highlightCode: reservation.ReservationNumber,
            cancellationToken: cancellationToken);
    }

    public Task NotifyReservationCancelledByClientAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        CancellationToken cancellationToken = default)
    {
        var greeting = BuildGreeting(fullName);
        var details = BuildReservationDetailsLines(reservation);
        var toursUrl = $"{_emailSender.FrontendBaseUrl}/tours";

        var body =
            $"{greeting}\n" +
            $"Confirmamos la cancelación de tu reserva pendiente #{reservation.ReservationNumber} sin ningún cargo.\n" +
            $"{details}\n" +
            $"Cuando desees reprogramar tu visita a Ayacucho, nuestros tours y hoteles aliados estarán disponibles.";

        return DispatchSafeAsync(
            template: "reservation.cancelled_client",
            recipientEmail: recipientEmail,
            subject: $"Reserva #{reservation.ReservationNumber} cancelada — DM GO TRAVEL",
            bodyText: body,
            idempotencyKey: $"res-cancel-client-{reservation.PublicId:N}",
            actionUrl: toursUrl,
            actionLabel: "Ver catálogo de experiencias",
            highlightCode: reservation.ReservationNumber,
            cancellationToken: cancellationToken);
    }

    public Task NotifyReservationCancelledByAdminAsync(
        Reservation reservation,
        string recipientEmail,
        string? fullName,
        string reason,
        bool refundOpened,
        CancellationToken cancellationToken = default)
    {
        var greeting = BuildGreeting(fullName);
        var details = BuildReservationDetailsLines(reservation);
        var accountUrl = $"{_emailSender.FrontendBaseUrl}/cuenta";
        var totalFormatted = FormatPen(reservation.Total.Amount);
        var refundNotice = refundOpened
            ? $"\nHemos abierto automáticamente tu caso de devolución total por {totalFormatted} PEN sin penalidad."
            : string.Empty;

        var body =
            $"{greeting}\n" +
            $"Te informamos que tu reserva #{reservation.ReservationNumber} fue cancelada antes del inicio del servicio.\n" +
            $"Motivo informado: {reason.Trim()}\n" +
            $"{details}{refundNotice}";

        return DispatchSafeAsync(
            template: "reservation.cancelled_admin",
            recipientEmail: recipientEmail,
            subject: $"Aviso de cancelación y reembolso — Reserva #{reservation.ReservationNumber}",
            bodyText: body,
            idempotencyKey: $"res-cancel-admin-{reservation.PublicId:N}",
            actionUrl: accountUrl,
            actionLabel: "Revisar estado en Mi Cuenta",
            highlightCode: reservation.ReservationNumber,
            cancellationToken: cancellationToken);
    }

    private async Task DispatchSafeAsync(
        string template,
        string recipientEmail,
        string subject,
        string bodyText,
        string idempotencyKey,
        string? actionUrl,
        string? actionLabel,
        string? highlightCode,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail) || !recipientEmail.Contains('@'))
        {
            return;
        }

        try
        {
            var now = _clock.UtcNow;
            var delivery = NotificationDelivery.Create(
                template,
                recipientEmail,
                subject,
                bodyText,
                now,
                _correlation.CorrelationId);

            var sendResult = await _emailSender.SendAsync(
                new EmailSendRequest(
                    ToEmail: delivery.RecipientEmail,
                    Subject: subject,
                    BodyText: bodyText,
                    Template: template,
                    IdempotencyKey: idempotencyKey,
                    ActionUrl: actionUrl,
                    ActionLabel: actionLabel,
                    HighlightCode: highlightCode),
                cancellationToken);

            if (sendResult.Sent && !string.IsNullOrWhiteSpace(sendResult.ProviderMessageId))
            {
                delivery.MarkSent(sendResult.Provider, sendResult.ProviderMessageId, _clock.UtcNow);
            }
            else
            {
                var errorDetail = sendResult.Error ?? "No se pudo completar el envío inmediato con Resend.";
                delivery.MarkFailed(errorDetail, _clock.UtcNow, _clock.UtcNow.AddMinutes(2));
            }

            await _notifications.AddDeliveryAsync(delivery, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "No se pudo despachar o registrar el correo '{Template}' para la reserva ({HighlightCode}).",
                template,
                highlightCode);
        }
    }

    private static string BuildGreeting(string? fullName) =>
        string.IsNullOrWhiteSpace(fullName)
            ? "¡Hola, viajero!"
            : $"¡Hola, {fullName.Trim()}!";

    private static string BuildReservationDetailsLines(Reservation reservation)
    {
        var snap = reservation.OfferSnapshot;
        var offerName = snap?.OfferName ?? "Experiencia turística DM GO TRAVEL";
        var travelers = snap?.Travelers ?? 1;
        var limaStart = snap is not null
            ? snap.DepartureStartsAtUtc.AddHours(-5).ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture) + " (Hora de Perú)"
            : "Horario programado";

        var lodgingLine = reservation.LodgingSnapshot is not null
            ? $"Hotel aliado: {reservation.LodgingSnapshot.HotelName} · {reservation.LodgingSnapshot.RoomTypeName} ({reservation.LodgingSnapshot.CheckInDate:yyyy-MM-dd} al {reservation.LodgingSnapshot.CheckOutDate:yyyy-MM-dd}, {reservation.LodgingSnapshot.Nights} noche(s))"
            : "Alojamiento aliado: No incluido (solo experiencia turística)";

        var totalPen = FormatPen(reservation.Total.Amount);

        return
            $"Experiencia: {offerName}\n" +
            $"Fecha de salida: {limaStart}\n" +
            $"Viajeros: {travelers}\n" +
            $"{lodgingLine}\n" +
            $"Importe total: {totalPen} {reservation.Total.Currency}";
    }

    private static string FormatPen(decimal amount) =>
        $"S/ {amount.ToString("N2", CultureInfo.InvariantCulture)}";
}
