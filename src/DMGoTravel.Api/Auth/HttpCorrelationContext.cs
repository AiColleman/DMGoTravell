using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Api.Auth;

/// <summary>
/// Expone el identificador de traza de ASP.NET Core como referencia de correlación
/// de auditoría. El middleware de errores usa el mismo valor en <c>traceId</c>.
/// </summary>
public sealed class HttpCorrelationContext : ICorrelationContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpCorrelationContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? CorrelationId => _httpContextAccessor.HttpContext?.TraceIdentifier;
}
