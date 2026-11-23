using System.Security.Cryptography;
using System.Text;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using MediatR;

namespace DMGoTravel.Application.Common.Behaviors;

/// <summary>
/// Envuelve los comandos idempotentes en el almacén durable. La validación se ejecuta
/// antes, de modo que una petición inválida no reserva la clave.
/// </summary>
public sealed class IdempotencyBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IIdempotencyStore _store;
    private readonly ICurrentUser _currentUser;

    public IdempotencyBehavior(IIdempotencyStore store, ICurrentUser currentUser)
    {
        _store = store;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not IIdempotentCommand idempotent)
        {
            return await next(cancellationToken);
        }

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var requestHash = ComputeRequestHash(idempotent.GetRequestFingerprint());

        var execution = await _store.ExecuteAsync(
            _currentUser.UserId.Value,
            idempotent.IdempotencyScope,
            idempotent.IdempotencyKey,
            requestHash,
            token => next(token),
            cancellationToken);

        return execution.Response;
    }

    private static string ComputeRequestHash(string fingerprint)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(fingerprint));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
