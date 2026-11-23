namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Abstracción del reloj del sistema para permitir control determinista del tiempo en pruebas
/// y asegurar que todos los instantes se registren estrictamente en UTC normalizado.
/// </summary>
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
    DateOnly TodayInPeru { get; }
    DateTime ToUtcStartOfDay(DateOnly date);
    DateTime ToUtcStartOfNextDay(DateOnly date);
}
