namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Contrato transaccional para confirmar mutaciones atómicas entre módulos dentro del mismo proceso.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
