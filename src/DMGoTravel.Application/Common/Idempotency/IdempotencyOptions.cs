namespace DMGoTravel.Application.Common.Idempotency;

public sealed class IdempotencyOptions
{
    public int RetentionHours { get; set; } = 48;
}
