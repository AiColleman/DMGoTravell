using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Reservations;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

/// <summary>
/// Lector administrativo de cuentas cliente y de la cantidad de reservas
/// asociadas. La consulta se resuelve en una sola operación SQL por lista;
/// el conteo es una subconsulta correlacionada, no una lectura N+1.
/// </summary>
public sealed class AdminClientRepository : IAdminClientRepository
{
    private static readonly ReservationStatus[] CountedStatuses =
    [
        ReservationStatus.Pending,
        ReservationStatus.Confirmed,
        ReservationStatus.Completed,
        ReservationStatus.Cancelled
    ];

    private readonly ApplicationDbContext _db;

    public AdminClientRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<ClientRecord> Items, int Total)> ListAsync(
        ClientQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(filter);
        var total = await query.CountAsync(cancellationToken);

        var items = await Project(
                query
                    .OrderByDescending(user => user.CreatedAtUtc)
                    .ThenByDescending(user => user.Id))
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<ClientRecord?> GetByPublicIdAsync(
        Guid publicId,
        CancellationToken cancellationToken = default) =>
        Project(
                _db.Users
                    .AsNoTracking()
                    .Where(user =>
                        user.PublicId == publicId &&
                        user.Role == UserRole.Client))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<ClientRecord>> CaptureAsync(
        ClientQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        return await Project(
                ApplyFilters(filter)
                    .OrderByDescending(user => user.CreatedAtUtc)
                    .ThenByDescending(user => user.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, bool>> GetCurrentDeletionStatesAsync(
        IReadOnlyCollection<Guid> publicIds,
        CancellationToken cancellationToken = default)
    {
        if (publicIds.Count == 0)
        {
            return new Dictionary<Guid, bool>();
        }

        var ids = publicIds.Distinct().ToArray();
        var states = await _db.Users
            .AsNoTracking()
            .Where(user =>
                user.Role == UserRole.Client &&
                ids.Contains(user.PublicId))
            .Select(user => new
            {
                user.PublicId,
                IsDeleted = user.DeletedAtUtc != null || user.Status == UserStatus.Closed
            })
            .ToListAsync(cancellationToken);

        return states.ToDictionary(state => state.PublicId, state => state.IsDeleted);
    }

    private IQueryable<User> ApplyFilters(ClientQueryFilter filter)
    {
        var query = _db.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.Client);

        // RF-54: un cliente dado de baja no puede localizarse por su nombre o
        // correo ocultos. Los demás filtros sí pueden encontrarlo para mostrar
        // únicamente los campos permitidos por RF-44.
        if (filter.Name is not null || filter.Email is not null)
        {
            query = query.Where(user =>
                user.DeletedAtUtc == null &&
                user.Status != UserStatus.Closed);
        }

        if (filter.Name is not null)
        {
            var name = filter.Name.ToLowerInvariant();
            query = query.Where(user =>
                user.Profile != null &&
                user.Profile.FullName.ToLower().Contains(name));
        }

        if (filter.Email is not null)
        {
            var email = filter.Email.ToLowerInvariant();
            query = query.Where(user => user.Email.ToLower().Contains(email));
        }

        if (filter.Id is not null)
        {
            query = query.Where(user => user.PublicId == filter.Id.Value);
        }

        if (filter.Status is not null)
        {
            query = query.Where(user => user.Status == filter.Status.Value);
        }

        if (filter.RegisteredFromUtc is not null)
        {
            query = query.Where(user => user.CreatedAtUtc >= filter.RegisteredFromUtc.Value);
        }

        if (filter.RegisteredToUtcExclusive is not null)
        {
            query = query.Where(user => user.CreatedAtUtc < filter.RegisteredToUtcExclusive.Value);
        }

        return query;
    }

    private IQueryable<ClientRecord> Project(IQueryable<User> query) =>
        query.Select(user => new ClientRecord(
            user.PublicId,
            user.DeletedAtUtc == null && user.Status != UserStatus.Closed && user.Profile != null
                ? user.Profile.FullName
                : null,
            user.DeletedAtUtc == null && user.Status != UserStatus.Closed
                ? user.Email
                : null,
            user.DeletedAtUtc == null && user.Status != UserStatus.Closed && user.Profile != null
                ? user.Profile.Phone
                : null,
            user.DeletedAtUtc == null && user.Status != UserStatus.Closed
                ? user.IsEmailVerified
                : false,
            user.Status,
            user.DeletedAtUtc != null || user.Status == UserStatus.Closed,
            user.CreatedAtUtc,
            _db.Reservations.Count(reservation =>
                reservation.AccountId == user.Id &&
                CountedStatuses.Contains(reservation.Status))));
}
