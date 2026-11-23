using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Payments;

/// <summary>
/// Caso de devolución vinculado a un cobro externo confirmado (Spec 002 / Spec 009).
/// </summary>
public class RefundCase : Entity<long>
{
    public const string StatusOpen = "open";
    public const string StatusAuthorized = "authorized";
    public const string StatusExecuted = "executed";
    public const string StatusFailed = "failed";
    public const string StatusUnknown = "unknown";

    public long ReservationId { get; private set; }
    public long PaymentAttemptId { get; private set; }
    public long ExternalPaymentId { get; private set; }
    public Money Amount { get; private set; } = Money.Zero();
    public string Status { get; private set; } = StatusOpen;
    public string Reason { get; private set; } = string.Empty;
    public string Provider { get; private set; } = "culqi";
    public string? ProviderRefundId { get; private set; }
    public long? AuthorizedByAdminId { get; private set; }
    public DateTime? AuthorizedAtUtc { get; private set; }
    public DateTime? ExecutedAtUtc { get; private set; }
    public string? LastError { get; private set; }
    public string? EvidenceJson { get; private set; }

    private RefundCase() { }

    public static RefundCase Open(
        long reservationId,
        long paymentAttemptId,
        long externalPaymentId,
        Money amount,
        string reason,
        string provider,
        DateTime nowUtc)
    {
        if (amount.Amount <= 0)
            throw new DomainException("El monto de devolución debe ser mayor a cero.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("El motivo de la devolución es obligatorio.");

        return new RefundCase
        {
            ReservationId = reservationId,
            PaymentAttemptId = paymentAttemptId,
            ExternalPaymentId = externalPaymentId,
            Amount = amount.Copy(),
            Status = StatusOpen,
            Reason = reason.Trim(),
            Provider = string.IsNullOrWhiteSpace(provider) ? "culqi" : provider.Trim().ToLowerInvariant(),
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc
        };
    }

    public void Authorize(long adminId, DateTime nowUtc)
    {
        if (Status != StatusOpen)
            throw new DomainException($"Solo se pueden autorizar devoluciones en estado '{StatusOpen}'.");

        Status = StatusAuthorized;
        AuthorizedByAdminId = adminId;
        AuthorizedAtUtc = nowUtc;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void MarkExecuted(string providerRefundId, DateTime executedAtUtc, string? evidenceJson = null)
    {
        if (string.IsNullOrWhiteSpace(providerRefundId))
            throw new DomainException("La referencia externa de devolución es obligatoria.");

        if (Status == StatusExecuted)
        {
            return;
        }

        Status = StatusExecuted;
        ProviderRefundId = providerRefundId.Trim();
        ExecutedAtUtc = executedAtUtc;
        LastError = null;
        if (!string.IsNullOrWhiteSpace(evidenceJson))
        {
            EvidenceJson = evidenceJson;
        }

        UpdatedAtUtc = executedAtUtc;
        RowVersion++;
    }

    public void MarkFailed(string error, DateTime nowUtc, string? evidenceJson = null)
    {
        if (Status == StatusExecuted)
            throw new DomainException("No se puede marcar como fallida una devolución ya ejecutada.");

        Status = StatusFailed;
        LastError = string.IsNullOrWhiteSpace(error) ? "Error en la pasarela de devolución." : error.Trim();
        if (!string.IsNullOrWhiteSpace(evidenceJson))
        {
            EvidenceJson = evidenceJson;
        }

        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void MarkUnknown(string detail, DateTime nowUtc, string? evidenceJson = null)
    {
        if (Status == StatusExecuted)
            throw new DomainException("No se puede marcar como incierta una devolución ya ejecutada.");

        Status = StatusUnknown;
        LastError = string.IsNullOrWhiteSpace(detail) ? "Respuesta incierta de la pasarela." : detail.Trim();
        if (!string.IsNullOrWhiteSpace(evidenceJson))
        {
            EvidenceJson = evidenceJson;
        }

        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }

    public void PrepareRetry(DateTime nowUtc)
    {
        if (Status is not (StatusFailed or StatusUnknown or StatusAuthorized))
            throw new DomainException("Solo se pueden reintentar devoluciones fallidas, inciertas o autorizadas pendientes.");

        Status = StatusAuthorized;
        UpdatedAtUtc = nowUtc;
        RowVersion++;
    }
}
