namespace DMGoTravel.Domain.Modules.Payments;

public static class PaymentMethod
{
    public const string Card = "card";
    public const string Yape = "yape";

    public static readonly IReadOnlyCollection<string> All = [Card, Yape];
}
