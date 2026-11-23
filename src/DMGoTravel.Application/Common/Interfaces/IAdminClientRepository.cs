using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Filtros de la consulta administrativa de clientes. Los textos llegan ya
/// normalizados; las fechas se expresan como instantes UTC semiabiertos.
/// </summary>
public sealed record ClientQueryFilter(
    int Page,
    int PageSize,
    string? Name,
    string? Email,
    Guid? Id,
    UserStatus? Status,
    DateTime? RegisteredFromUtc,
    DateTime? RegisteredToUtcExclusive);

/// <summary>
/// Proyección de lectura autorizada de una cuenta cliente. Los campos
/// personales se conservan aquí para que la capa de aplicación aplique la
/// restricción de baja lógica antes de responder o exportar.
/// </summary>
public sealed record ClientRecord(
    Guid PublicId,
    string? FullName,
    string? Email,
    string? Phone,
    bool EmailVerified,
    UserStatus Status,
    bool IsDeleted,
    DateTime RegisteredAtUtc,
    int ReservationCount);

public interface IAdminClientRepository
{
    Task<(IReadOnlyList<ClientRecord> Items, int Total)> ListAsync(
        ClientQueryFilter filter,
        CancellationToken cancellationToken = default);

    Task<ClientRecord?> GetByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Materializa todos los clientes que cumplen el filtro, sin paginación, para
    /// una copia de exportación. El orden es el mismo que usa la consulta paginada.
    /// </summary>
    Task<IReadOnlyList<ClientRecord>> CaptureAsync(
        ClientQueryFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Relee la baja lógica actual de los clientes capturados. Un identificador
    /// ausente se trata como no visible por la capa de aplicación.
    /// </summary>
    Task<IReadOnlyDictionary<Guid, bool>> GetCurrentDeletionStatesAsync(
        IReadOnlyCollection<Guid> publicIds,
        CancellationToken cancellationToken = default);
}
