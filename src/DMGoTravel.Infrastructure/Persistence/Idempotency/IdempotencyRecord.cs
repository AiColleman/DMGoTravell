namespace DMGoTravel.Infrastructure.Persistence.Idempotency;

/// <summary>
/// Registro durable de una clave de idempotencia. La respuesta se guarda como JSON
/// para poder reproducirla sin volver a ejecutar los efectos de la operación.
/// </summary>
public sealed class IdempotencyRecord
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Scope { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public string? ResponseJson { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
