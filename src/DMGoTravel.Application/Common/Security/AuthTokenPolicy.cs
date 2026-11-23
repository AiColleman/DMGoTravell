namespace DMGoTravel.Application.Common.Security;

/// <summary>
/// Vigencias técnicas de las pruebas de identidad (plan de 005, sección 5).
/// Son parámetros operativos, no decisiones comerciales.
/// </summary>
public static class AuthTokenPolicy
{
    public const int EmailVerificationHours = 24;

    public const int PasswordResetMinutes = 30;
}
