namespace DMGoTravel.Domain.Modules.Reservations;

public enum CancellationOrigin
{
    Client = 1,
    Admin = 2,
    Expiry = 3,
    PaymentReject = 4
}
