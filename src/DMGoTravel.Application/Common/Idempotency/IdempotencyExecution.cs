namespace DMGoTravel.Application.Common.Idempotency;

/// <summary>
/// Resultado de ejecutar un comando idempotente.
/// <paramref name="Replayed"/> indica que la respuesta proviene de una ejecución previa.
/// </summary>
public sealed record IdempotencyExecution<T>(bool Replayed, T Response);
