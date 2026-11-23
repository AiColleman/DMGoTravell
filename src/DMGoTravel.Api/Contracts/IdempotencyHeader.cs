namespace DMGoTravel.Api.Contracts;

public static class IdempotencyHeader
{
    public const string Name = "Idempotency-Key";

    public static string Read(HttpContext context) =>
        context.Request.Headers[Name].ToString().Trim();
}
