namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Abstracción del contexto del usuario autenticado que realiza la solicitud.
/// Permite desacoplar Application de las cabeceras HTTP y HttpContext de Presentation.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    Guid? SessionId { get; }
    int? SecurityVersion { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin => Role == "admin";
}
