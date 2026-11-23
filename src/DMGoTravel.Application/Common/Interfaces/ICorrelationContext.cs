namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Referencia de correlación de la petición actual, si existe (010/RF-14).
/// </summary>
public interface ICorrelationContext
{
    string? CorrelationId { get; }
}
