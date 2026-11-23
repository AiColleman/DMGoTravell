namespace DMGoTravel.Application.Common.Idempotency;

/// <summary>
/// Almacén durable de claves de idempotencia. La operación y el registro se confirman
/// en la misma transacción para que un fallo no deje efectos parciales.
/// </summary>
public interface IIdempotencyStore
{
    Task<IdempotencyExecution<T>> ExecuteAsync<T>(
        Guid userId,
        string scope,
        string key,
        string requestHash,
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken);
}
