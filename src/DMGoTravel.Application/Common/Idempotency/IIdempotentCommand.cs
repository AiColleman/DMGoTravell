namespace DMGoTravel.Application.Common.Idempotency;

/// <summary>
/// Marca un comando que debe ejecutarse una sola vez por clave de idempotencia.
/// </summary>
public interface IIdempotentCommand
{
    /// <summary>Clave opaca enviada por el cliente en la cabecera Idempotency-Key.</summary>
    string IdempotencyKey { get; }

    /// <summary>Ámbito estable de la operación; separa claves de endpoints distintos.</summary>
    string IdempotencyScope { get; }

    /// <summary>Representación canónica de los datos que identifican la petición.</summary>
    string GetRequestFingerprint();
}
