using System.Security.Claims;
using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Api.Auth;

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public Guid? UserId
    {
        get
        {
            var value = _accessor.HttpContext?.User.FindFirst("sub")?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Email => _accessor.HttpContext?.User.FindFirst("email")?.Value;

    public string? Role => _accessor.HttpContext?.User.FindFirst("role")?.Value;

    public Guid? SessionId
    {
        get
        {
            var value = _accessor.HttpContext?.User.FindFirst("sid")?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public int? SecurityVersion
    {
        get
        {
            var value = _accessor.HttpContext?.User.FindFirst("ver")?.Value;
            return int.TryParse(value, out var version) ? version : null;
        }
    }

    public bool IsAuthenticated => _accessor.HttpContext?.User.Identity?.IsAuthenticated == true;
}
