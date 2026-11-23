using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Infrastructure.Persistence.Idempotency;

public sealed class IdempotencyStore : IIdempotencyStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly IdempotencyOptions _options;

    public IdempotencyStore(
        ApplicationDbContext db,
        IDateTimeProvider clock,
        IOptions<IdempotencyOptions> options)
    {
        _db = db;
        _clock = clock;
        _options = options.Value;
    }

    public async Task<IdempotencyExecution<T>> ExecuteAsync<T>(
        Guid userId,
        string scope,
        string key,
        string requestHash,
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken)
    {
        var retentionHours = Math.Max(1, _options.RetentionHours);
        var now = _clock.UtcNow;
        var expiresAt = now.AddHours(retentionHours);

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        // Permite reutilizar una clave cuyo registro ya expiró.
        await _db.Database.ExecuteSqlInterpolatedAsync($"""
            DELETE FROM idempotency_record
            WHERE user_id = {userId}
              AND scope = {scope}
              AND "key" = {key}
              AND expires_at_utc <= {now}
            """, cancellationToken);

        // Si otra transacción tiene la misma clave, este INSERT espera a que confirme
        // o revierta. El índice único es la única autoridad de concurrencia.
        var inserted = await _db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO idempotency_record
                (user_id, scope, "key", request_hash, created_at_utc, expires_at_utc)
            VALUES
                ({userId}, {scope}, {key}, {requestHash}, {now}, {expiresAt})
            ON CONFLICT (user_id, scope, "key") DO NOTHING
            """, cancellationToken);

        if (inserted == 0)
        {
            var existing = await _db.IdempotencyRecords
                .AsNoTracking()
                .SingleAsync(
                    record => record.UserId == userId
                        && record.Scope == scope
                        && record.Key == key,
                    cancellationToken);

            if (!string.Equals(existing.RequestHash, requestHash, StringComparison.Ordinal))
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new ConflictAppException(
                    "idempotency_conflict",
                    "La clave de idempotencia ya se usó con otro cuerpo.");
            }

            if (string.IsNullOrWhiteSpace(existing.ResponseJson))
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new ConflictAppException(
                    "idempotency_conflict",
                    "La clave de idempotencia está siendo procesada.");
            }

            var replayed = JsonSerializer.Deserialize<T>(existing.ResponseJson, JsonOptions)
                ?? throw new InvalidOperationException(
                    "No se pudo reconstruir la respuesta idempotente almacenada.");

            await transaction.RollbackAsync(cancellationToken);
            return new IdempotencyExecution<T>(true, replayed);
        }

        try
        {
            var response = await operation(cancellationToken);
            var responseJson = JsonSerializer.Serialize(response, JsonOptions);
            var completedAt = _clock.UtcNow;

            await _db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE idempotency_record
                SET response_json = {responseJson},
                    completed_at_utc = {completedAt}
                WHERE user_id = {userId}
                  AND scope = {scope}
                  AND "key" = {key}
                """, cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return new IdempotencyExecution<T>(false, response);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
