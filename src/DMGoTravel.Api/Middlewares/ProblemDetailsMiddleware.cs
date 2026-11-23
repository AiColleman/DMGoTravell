using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Domain.Common;
using System.Diagnostics;
using System.Text.Json;

namespace DMGoTravel.Api.Middlewares;

/// <summary>
/// Middleware de manejo global de excepciones conforme al contrato DEC-220 y RFC 7807.
/// Garantiza que todos los errores devuelvan application/problem+json con estructura uniforme:
/// type, title, status, code, traceId, detail.
/// </summary>
public sealed class ProblemDetailsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ProblemDetailsMiddleware> _logger;

    public ProblemDetailsMiddleware(RequestDelegate next, ILogger<ProblemDetailsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (ex is AppException or DomainException)
            {
                _logger.LogWarning(ex, "Solicitud rechazada: {Message}", ex.Message);
            }
            else
            {
                _logger.LogError(ex, "Excepción no controlada procesada en middleware de errores: {Message}", ex.Message);
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        int status;
        string code;
        string title;
        string detail = exception.Message;
        IReadOnlyCollection<FieldError>? errors = null;
        IReadOnlyCollection<ClosureBlocker>? blockers = null;

        switch (exception)
        {
            case AccountClosureBlockedAppException closureBlocked:
                status = closureBlocked.StatusCode;
                code = closureBlocked.Code;
                title = TitleForStatus(closureBlocked.StatusCode);
                blockers = closureBlocked.Blockers;
                break;

            case AppException appEx:
                status = appEx.StatusCode;
                code = appEx.Code;
                title = TitleForStatus(appEx.StatusCode);
                errors = appEx.Errors;
                break;

            case DomainException domainEx:
                status = StatusCodes.Status400BadRequest;
                code = domainEx.ErrorCode ?? "domain_rule_violation";
                title = "Violación de regla de dominio";
                break;

            case UnauthorizedAccessException:
                status = StatusCodes.Status401Unauthorized;
                code = "unauthenticated";
                title = "No autenticado";
                break;

            case KeyNotFoundException:
                status = StatusCodes.Status404NotFound;
                code = "not_found";
                title = "Recurso no encontrado";
                break;

            case BadHttpRequestException badRequest:
                status = badRequest.StatusCode;
                code = "malformed_request";
                title = "Solicitud inválida";
                detail = "El cuerpo o los parámetros de la solicitud no son válidos.";
                break;

            default:
                status = StatusCodes.Status500InternalServerError;
                code = "internal_error";
                title = "Error interno del servidor";
                detail = "Ha ocurrido un error inesperado al procesar la solicitud.";
                break;
        }

        context.Response.StatusCode = status;

        var problemDetails = new
        {
            type = $"https://dmgotravel.com/errors/{code}",
            title,
            status,
            code,
            traceId,
            detail,
            instance = context.Request.Path.Value,
            errors = errors?.Select(error => new
            {
                field = error.Field,
                message = error.Message,
                code = error.Code
            }),
            blockers = blockers?.Select(blocker => new
            {
                type = blocker.Type,
                reference = blocker.Reference,
                status = blocker.Status
            })
        };

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        });

        return context.Response.WriteAsync(json);
    }

    private static string TitleForStatus(int status) => status switch
    {
        400 => "Solicitud inválida",
        401 => "No autenticado",
        403 => "Prohibido",
        404 => "Recurso no encontrado",
        409 => "Conflicto",
        413 => "Contenido demasiado grande",
        415 => "Tipo de contenido no admitido",
        429 => "Demasiadas solicitudes",
        503 => "Servicio no disponible",
        _ => "Error"
    };
}
