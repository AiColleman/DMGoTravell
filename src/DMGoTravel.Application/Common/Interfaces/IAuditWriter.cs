namespace DMGoTravel.Application.Common.Interfaces;

/// <summary>
/// Puerto de auditoría de operaciones críticas (005/RF-30, 010/RF-9-RF-15).
/// El registro se anexa al mismo <see cref="IUnitOfWork"/> que la operación para
/// confirmarse o revertirse juntos; el llamador decide cuándo persistir.
/// </summary>
public interface IAuditWriter
{
    void Record(AuditEntry entry);
}

/// <summary>
/// Datos mínimos de un registro de auditoría. No admite secretos, contraseñas ni
/// tokens; <see cref="EntityId"/> usa el identificador público de la entidad.
/// </summary>
public sealed record AuditEntry(
    string OperationId,
    string Action,
    string ActorType,
    long? ActorId,
    string EntityType,
    string EntityId,
    string Result,
    string? ChangesJson = null);

/// <summary>
/// Identificadores técnicos de auditoría. <see cref="Action"/> reutiliza el
/// <c>operationId</c> estable del OpenAPI; el catálogo oficial de acciones de 010
/// sigue pendiente de ratificación y no se declara cerrado por estas constantes.
/// </summary>
public static class AuditActions
{
    public const string Register = "auth.register";
    public const string Login = "auth.login";
    public const string Refresh = "auth.refresh";
    public const string Logout = "auth.logout";
    public const string VerifyEmail = "auth.verifyEmail";
    public const string ResendVerification = "auth.resendVerification";
    public const string ForgotPassword = "auth.forgotPassword";
    public const string ResetPassword = "auth.resetPassword";

    public const string ReservationCreate = "reservations.create";
    public const string ReservationCancel = "reservations.cancel";
    public const string PaymentStart = "payments.start";

    public const string ProfileUpdate = "profile.update";
    public const string ProfileRequestEmailChange = "profile.requestEmailChange";
    public const string ProfileConfirmEmailChange = "profile.confirmEmailChange";
    public const string ProfileRequestClosure = "profile.requestClosure";

    public const string ActorHuman = "human";
    public const string ActorSystem = "system";
    public const string ActorUnidentified = "unidentified";

    public const string Success = "success";
    public const string Failure = "failure";
}
