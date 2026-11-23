using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Payments;

public class ExternalPayment : Entity<long>
{
    public string Provider { get; private set; } = "culqi";
    public string ProviderTransactionId { get; private set; } = string.Empty;
    public long AttemptId { get; private set; }
    public long ReservationId { get; private set; }
    public Money Amount { get; private set; } = Money.Zero();
    public string Status { get; private set; } = string.Empty;
    public DateTime OccurredAtUtc { get; private set; }

    private ExternalPayment() { }

    public ExternalPayment(
        string providerTransactionId,
        long attemptId,
        long reservationId,
        Money amount,
        string status,
        DateTime occurredAtUtc,
        string provider = "culqi")
    {
        if (string.IsNullOrWhiteSpace(providerTransactionId))
            throw new DomainException("El identificador de transacción externa es obligatorio.");

        Provider = string.IsNullOrWhiteSpace(provider) ? "culqi" : provider.Trim().ToLowerInvariant();
        ProviderTransactionId = providerTransactionId.Trim();
        AttemptId = attemptId;
        ReservationId = reservationId;
        Amount = amount.Copy();
        Status = status;
        OccurredAtUtc = occurredAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }
}
