namespace DMGoTravel.Domain.Common;

/// <summary>
/// Clase base para todas las entidades del dominio con clave técnica interna y clave pública.
/// Cumple con las convenciones de MD-01: bigint interno para joins de alta performance y UUID público opaco para la API.
/// </summary>
public abstract class Entity<TId> where TId : notnull
{
    public TId Id { get; protected set; } = default!;

    public Guid PublicId { get; protected set; } = Guid.NewGuid();

    public DateTime CreatedAtUtc { get; protected set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; protected set; }

    public long RowVersion { get; protected set; } = 1;

    protected Entity() { }

    protected Entity(TId id, Guid publicId)
    {
        Id = id;
        PublicId = publicId;
    }
}
