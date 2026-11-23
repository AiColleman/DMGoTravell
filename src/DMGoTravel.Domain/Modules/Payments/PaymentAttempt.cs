using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Payments;

public class PaymentAttempt : Entity<long>
{
    public long ReservationId { get; private set; }
    public long AccountId { get; private set; }
    public string Method { get; private set; } = PaymentMethod.Card;
    public Money Amount { get; private set; } = Money.Zero();
    public PaymentStatus Status { get; private set; } = PaymentStatus.Created;
    public string? ProviderRequestRef { get; private set; }

    private PaymentAttempt() { }

    public PaymentAttempt(long reservationId, long accountId, string method, Money amount)
    {
        if (!PaymentMethod.All.Contains(method))
            throw new DomainException($"Método de pago no admitido: '{method}'. Solo se acepta tarjeta o Yape.");

        ReservationId = reservationId;
        AccountId = accountId;
        Method = method;
        Amount = amount.Copy();
        Status = PaymentStatus.Created;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void MarkSent(string providerRequestRef)
    {
        Status = PaymentStatus.Sent;
        ProviderRequestRef = providerRequestRef;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    public void MarkApproved()
    {
        Status = PaymentStatus.Approved;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    public void MarkRejected()
    {
        Status = PaymentStatus.Rejected;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    public void MarkUnknown()
    {
        Status = PaymentStatus.Unknown;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }
}
