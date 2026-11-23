namespace DMGoTravel.Application.Common.Exceptions;

public sealed record FieldError(string Field, string Message, string? Code = null);

/// <summary>
/// Error controlado de aplicación que el middleware traduce a ProblemDetails.
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
    public IReadOnlyCollection<FieldError>? Errors { get; }

    public AppException(int statusCode, string code, string detail, IReadOnlyCollection<FieldError>? errors = null)
        : base(detail)
    {
        StatusCode = statusCode;
        Code = code;
        Errors = errors;
    }
}

public sealed class ValidationAppException : AppException
{
    public ValidationAppException(IReadOnlyCollection<FieldError> errors)
        : base(400, "validation_failed", "La solicitud no cumple el esquema.", errors)
    {
    }
}

public sealed class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string detail = "Falta un access token válido.")
        : base(401, "unauthenticated", detail)
    {
    }
}

public sealed class InvalidCredentialsAppException : AppException
{
    public InvalidCredentialsAppException()
        : base(401, "invalid_credentials", "Correo o contraseña incorrectos.")
    {
    }
}

public sealed class ForbiddenAppException : AppException
{
    public ForbiddenAppException(string code = "forbidden", string detail = "El rol no permite esta operación.")
        : base(403, code, detail)
    {
    }
}

public sealed class NotFoundAppException : AppException
{
    public NotFoundAppException(string detail = "El recurso no existe o no es accesible.")
        : base(404, "not_found", detail)
    {
    }
}

public sealed class ConflictAppException : AppException
{
    public ConflictAppException(string code, string detail)
        : base(409, code, detail)
    {
    }
}

public sealed class ConcurrencyConflictAppException : AppException
{
    public ConcurrencyConflictAppException(string code = "stale_version", string detail = "La versión enviada no coincide con la actual.")
        : base(409, code, detail)
    {
    }
}

public sealed class InvalidPageAppException : AppException
{
    public InvalidPageAppException()
        : base(400, "invalid_page", "El número de página debe ser mayor o igual a 1.")
    {
    }
}

public sealed class InvalidRangeAppException : AppException
{
    public InvalidRangeAppException(string detail = "El rango no es válido.")
        : base(400, "invalid_range", detail)
    {
    }
}

public sealed class InvalidFilterAppException : AppException
{
    public InvalidFilterAppException(string detail = "El filtro no es válido.")
        : base(400, "invalid_filter", detail)
    {
    }
}

public sealed class ExportExpiredAppException : AppException
{
    public ExportExpiredAppException()
        : base(410, "export_expired", "La referencia de exportación expiró; solicite una nueva.")
    {
    }
}

public sealed record ClosureBlocker(string Type, string Reference, string Status);

public sealed class AccountClosureBlockedAppException : AppException
{
    public IReadOnlyCollection<ClosureBlocker> Blockers { get; }

    public AccountClosureBlockedAppException(IReadOnlyCollection<ClosureBlocker> blockers)
        : base(409, "account_closure_blocked", "Existen operaciones activas que impiden la baja.")
    {
        Blockers = blockers;
    }
}

public sealed class ReportExpiredAppException : AppException
{
    public ReportExpiredAppException()
        : base(410, "report_expired", "La referencia del reporte expiró; genere una nueva consulta.")
    {
    }
}

public sealed class ReportNotReadyAppException : AppException
{
    public ReportNotReadyAppException()
        : base(409, "report_not_ready", "El PDF del reporte aún no ha sido generado; solicítelo primero.")
    {
    }
}
