using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Profile.RequestEmailChange;

public sealed record RequestEmailChangeCommand(
    string NewEmail,
    string? CurrentPassword,
    string IdempotencyKey) : IRequest<OperationAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "profile.requestEmailChange";

    public string GetRequestFingerprint() =>
        $"{NewEmail.Trim().ToUpperInvariant()}";
}

public sealed class RequestEmailChangeCommandValidator : AbstractValidator<RequestEmailChangeCommand>
{
    public RequestEmailChangeCommandValidator()
    {
        RuleFor(command => command.NewEmail)
            .NotEmpty().WithMessage("El nuevo correo es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo no es válido.")
            .MaximumLength(256).WithMessage("El correo no puede exceder 256 caracteres.");

        RuleFor(command => command.CurrentPassword)
            .NotEmpty().WithMessage("Se requiere confirmación expresa con la contraseña actual.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class RequestEmailChangeCommandHandler
    : IRequestHandler<RequestEmailChangeCommand, OperationAcceptedDto>
{
    private const int EmailChangeTokenMinutes = 30;

    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDevEmailTokenStore _devTokens;
    private readonly IAuditWriter _audit;

    public RequestEmailChangeCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IPasswordHasher passwordHasher,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IDevEmailTokenStore devTokens,
        IAuditWriter audit)
    {
        _currentUser = currentUser;
        _users = users;
        _passwordHasher = passwordHasher;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _devTokens = devTokens;
        _audit = audit;
    }

    public async Task<OperationAcceptedDto> Handle(
        RequestEmailChangeCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null ||
            user.Status != UserStatus.Active ||
            (_currentUser.SecurityVersion.HasValue && _currentUser.SecurityVersion.Value != user.SecurityVersion))
        {
            throw new UnauthorizedAppException();
        }

        if (string.IsNullOrEmpty(request.CurrentPassword) ||
            !_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new InvalidCredentialsAppException();
        }

        var normalizedNewEmail = request.NewEmail.Trim().ToUpperInvariant();
        if (string.Equals(normalizedNewEmail, user.NormalizedEmail, StringComparison.Ordinal))
        {
            throw new ConflictAppException(
                "email_unchanged",
                "El correo solicitado coincide con el correo vigente de la cuenta.");
        }

        if (await _users.EmailExistsAsync(normalizedNewEmail, cancellationToken))
        {
            throw new ConflictAppException(
                "email_already_registered",
                "El correo solicitado ya está ocupado por otra cuenta.");
        }

        var now = _clock.UtcNow;
        var expiresAt = now.AddMinutes(EmailChangeTokenMinutes);
        var hadPreviousPending = user.PendingEmail is not null &&
            user.EmailChangeExpiresAtUtc.HasValue &&
            user.EmailChangeExpiresAtUtc.Value > now;

        var rawToken = TokenGenerator.CreateOpaqueToken();
        user.RequestEmailChange(request.NewEmail, TokenGenerator.Hash(rawToken), now, expiresAt);

        _audit.Record(new AuditEntry(
            AuditActions.ProfileRequestEmailChange,
            AuditActions.ProfileRequestEmailChange,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                emailChangeRequested = true,
                supersededPrevious = hadPreviousPending,
                expiresAt = DateTime.SpecifyKind(expiresAt, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ")
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _devTokens.SetEmailChange(user.PendingEmail!, rawToken);

        return new OperationAcceptedDto(
            Guid.NewGuid(),
            "accepted",
            DateTime.SpecifyKind(now, DateTimeKind.Utc),
            DateTime.SpecifyKind(expiresAt, DateTimeKind.Utc));
    }
}
