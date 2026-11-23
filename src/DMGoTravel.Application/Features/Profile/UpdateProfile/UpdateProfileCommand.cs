using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Profile.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Profile.UpdateProfile;

public sealed record UpdateProfileCommand(
    bool HasFullName,
    string? FullName,
    bool HasPhone,
    string? Phone,
    long? ExpectedVersion = null) : IRequest<ProfileResult>;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(command => command.FullName)
            .Must(name => !string.IsNullOrWhiteSpace(name))
            .When(command => command.HasFullName)
            .WithMessage("El nombre completo no puede estar vacío.")
            .MaximumLength(150)
            .When(command => command.HasFullName && command.FullName is not null)
            .WithMessage("El nombre completo no puede exceder 150 caracteres.");

        RuleFor(command => command.Phone)
            .MaximumLength(30)
            .When(command => command.HasPhone && command.Phone is not null)
            .WithMessage("El teléfono no puede exceder 30 caracteres.");
    }
}

public sealed class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, ProfileResult>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public UpdateProfileCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _currentUser = currentUser;
        _users = users;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<ProfileResult> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
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

        if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != user.RowVersion)
        {
            throw new ConcurrencyConflictAppException();
        }

        var now = _clock.UtcNow;
        user.UpdateProfile(
            request.HasFullName ? request.FullName : null,
            request.HasPhone,
            request.Phone,
            now);

        _audit.Record(new AuditEntry(
            AuditActions.ProfileUpdate,
            AuditActions.ProfileUpdate,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                fullNameUpdated = request.HasFullName,
                phoneUpdated = request.HasPhone
            })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        PendingEmailChangeDto? pendingEmailChange = null;
        if (user.PendingEmail is not null &&
            user.EmailChangeRequestedAtUtc.HasValue &&
            user.EmailChangeExpiresAtUtc.HasValue &&
            user.EmailChangeExpiresAtUtc.Value > now)
        {
            pendingEmailChange = new PendingEmailChangeDto(
                user.PendingEmail,
                DateTime.SpecifyKind(user.EmailChangeRequestedAtUtc.Value, DateTimeKind.Utc));
        }

        var dto = new ProfileDto(
            user.PublicId,
            user.Email,
            user.Profile?.FullName ?? user.Email,
            user.Profile?.Phone,
            user.IsEmailVerified,
            pendingEmailChange);

        return new ProfileResult(dto, user.RowVersion);
    }
}
