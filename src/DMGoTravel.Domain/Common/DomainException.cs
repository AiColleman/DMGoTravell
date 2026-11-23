namespace DMGoTravel.Domain.Common;

/// <summary>
/// Excepción base de violaciones de reglas e invariantes del Dominio.
/// Se traduce automáticamente en ProblemDetails con código HTTP 400 o 409 según corresponda.
/// </summary>
public class DomainException : Exception
{
    public string? ErrorCode { get; }

    public DomainException(string message, string? errorCode = null) 
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public DomainException(string message, Exception innerException, string? errorCode = null) 
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
