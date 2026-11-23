using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Profile.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using MediatR;

namespace DMGoTravel.Application.Features.Profile.GetProfile;

public sealed record GetProfileQuery : IRequest<ProfileResult>;

public sealed class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, ProfileResult>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IDateTimeProvider _clock;

    public GetProfileQueryHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IDateTimeProvider clock)
    {
        _currentUser = currentUser;
        _users = users;
        _clock = clock;
    }

    public async Task<ProfileResult> Handle(GetProfileQuery request, CancellationToken cancellationToken)
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

        PendingEmailChangeDto? pendingEmailChange = null;
        if (user.PendingEmail is not null &&
            user.EmailChangeRequestedAtUtc.HasValue &&
            user.EmailChangeExpiresAtUtc.HasValue &&
            user.EmailChangeExpiresAtUtc.Value > _clock.UtcNow)
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
