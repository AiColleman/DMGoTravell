namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Almacén efímero de desarrollo para recuperar las pruebas de identidad sin enviar correo real.
/// No debe usarse en producción ni persistir secretos.
/// </summary>
public interface IDevEmailTokenStore
{
    void Set(string email, string token);
    bool TryGet(string email, out string? token);
    void SetPasswordReset(string email, string token);
    bool TryGetPasswordReset(string email, out string? token);
}
