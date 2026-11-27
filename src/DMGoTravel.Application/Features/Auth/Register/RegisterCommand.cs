using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.Register;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone) : IRequest<AuthResult>;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("El correo es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo no es válido.");

        RuleFor(command => command.Password)
            .NotEmpty().WithMessage("La contraseña es obligatoria.")
            .MinimumLength(12).WithMessage("La contraseña debe tener al menos 12 caracteres.")
            .MaximumLength(128).WithMessage("La contraseña no puede exceder 128 caracteres.");

        RuleFor(command => command.FullName)
            .NotEmpty().WithMessage("El nombre completo es obligatorio.")
            .MaximumLength(150).WithMessage("El nombre completo no puede exceder 150 caracteres.");
    }
}

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResult>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDevEmailTokenStore _devEmailTokens;
    private readonly IEmailSender _emailSender;
    private readonly IAuditWriter _audit;

    public RegisterCommandHandler(
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IDevEmailTokenStore devEmailTokens,
        IEmailSender emailSender,
        IAuditWriter audit)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _devEmailTokens = devEmailTokens;
        _emailSender = emailSender;
        _audit = audit;
    }

    public async Task<AuthResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();

        if (await _users.EmailExistsAsync(normalizedEmail, cancellationToken))
        {
            throw new ConflictAppException(
                "email_already_registered",
                "El correo ya está registrado por otra cuenta.");
        }

        var now = _clock.UtcNow;
        var passwordHash = _passwordHasher.Hash(request.Password);
        var user = User.CreateClient(request.Email, passwordHash, request.FullName, request.Phone);

        var verificationToken = TokenGenerator.CreateOpaqueToken();
        user.SetEmailVerificationToken(
            TokenGenerator.Hash(verificationToken),
            now.AddHours(AuthTokenPolicy.EmailVerificationHours));

        var familyId = Guid.NewGuid();
        var familyExpiresAtUtc = now.AddDays(14);
        var refreshToken = TokenGenerator.CreateOpaqueToken();
        var refresh = RefreshToken.Create(
            user,
            familyId,
            TokenGenerator.Hash(refreshToken),
            now,
            familyExpiresAtUtc);

        await _users.AddAsync(user, cancellationToken);
        await _refreshTokens.AddAsync(refresh, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.Register,
            AuditActions.Register,
            AuditActions.ActorHuman,
            null,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { emailVerified = false, role = user.Role })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _devEmailTokens.Set(user.Email, verificationToken);

        var verifyUrl =
            $"{_emailSender.FrontendBaseUrl}/acceso?mode=verify&token={Uri.EscapeDataString(verificationToken)}";
        await _emailSender.SendAsync(
            new EmailSendRequest(
                ToEmail: user.Email,
                Subject: "Confirma tu correo electrónico — DM GO TRAVEL",
                BodyText:
                    $"¡Hola, {request.FullName.Trim()}!\nGracias por registrarte en DM GO TRAVEL. Confirma tu correo electrónico haciendo clic en el botón o pegando el código en la pantalla de verificación (válido por {AuthTokenPolicy.EmailVerificationHours} horas).\nEnlace directo: {verifyUrl}",
                Template: "auth.email_verification",
                IdempotencyKey: $"reg-verify-{user.PublicId:N}",
                ActionUrl: verifyUrl,
                ActionLabel: "Verificar mi correo ahora",
                HighlightCode: verificationToken),
            cancellationToken);

        var access = _jwt.CreateAccessToken(user, familyId);
        var session = new AuthSessionDto(
            access.Token,
            "Bearer",
            Math.Max(1, (int)Math.Ceiling((access.ExpiresAtUtc - now).TotalSeconds)),
            AuthMapper.ToSummary(user));

        return new AuthResult(
            session,
            refreshToken,
            familyExpiresAtUtc,
            TokenGenerator.CreateOpaqueToken(24));
    }
}
