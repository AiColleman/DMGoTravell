namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Puerto de invalidación de caché descriptiva pública (AC01).
/// Nunca se cachean cupos, inventario hotelero, estado de reservas ni pagos.
/// </summary>
public interface ICacheInvalidator
{
    void InvalidateCatalog();
    void InvalidateMobility();
}
