using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.ForgotPassword;

public sealed record ForgotPasswordCommand(string Email) : IRequest<OperationAcceptedDto>;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("El correo es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo no es válido.");
    }
}

/// <summary>
/// Solicita la recuperación de contraseña. La respuesta es genérica para no revelar
/// si la cuenta existe (005/RF-22, DEC-144); el enlace solo se entrega al destinatario vigente.
/// </summary>
public sealed class ForgotPasswordCommandHandler
    : IRequestHandler<ForgotPasswordCommand, OperationAcceptedDto>
{
    private readonly IUserRepository _users;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDevEmailTokenStore _devEmailTokens;
    private readonly IEmailSender _emailSender;
    private readonly IAuditWriter _audit;

    public ForgotPasswordCommandHandler(
        IUserRepository users,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IDevEmailTokenStore devEmailTokens,
        IEmailSender emailSender,
        IAuditWriter audit)
    {
        _users = users;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _devEmailTokens = devEmailTokens;
        _emailSender = emailSender;
        _audit = audit;
    }

    public async Task<OperationAcceptedDto> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;
        var expiresAt = now.AddMinutes(AuthTokenPolicy.PasswordResetMinutes);
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        var user = await _users.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || user.Status != UserStatus.Active)
        {
            return new OperationAcceptedDto(Guid.NewGuid(), "accepted", now, expiresAt);
        }

        var resetToken = TokenGenerator.CreateOpaqueToken();
        user.SetPasswordResetToken(TokenGenerator.Hash(resetToken), expiresAt);

        _audit.Record(new AuditEntry(
            AuditActions.ForgotPassword,
            AuditActions.ForgotPassword,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { resetRequested = true, expiresAt })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _devEmailTokens.SetPasswordReset(user.Email, resetToken);

        var resetUrl =
            $"{_emailSender.FrontendBaseUrl}/acceso?mode=reset&token={Uri.EscapeDataString(resetToken)}";
        await _emailSender.SendAsync(
            new EmailSendRequest(
                ToEmail: user.Email,
                Subject: "Restablecimiento de contraseña — DM GO TRAVEL",
                BodyText:
                    $"Recibimos una solicitud para restablecer la contraseña de tu cuenta en DM GO TRAVEL.\nEste enlace es válido por {AuthTokenPolicy.PasswordResetMinutes} minutos. Si no realizaste esta solicitud, puedes ignorar este mensaje.\nEnlace directo: {resetUrl}",
                Template: "auth.password_reset",
                IdempotencyKey: $"pwd-reset-{Guid.NewGuid():N}",
                ActionUrl: resetUrl,
                ActionLabel: "Restablecer contraseña",
                HighlightCode: resetToken),
            cancellationToken);

        return new OperationAcceptedDto(Guid.NewGuid(), "accepted", now, expiresAt);
    }
}
