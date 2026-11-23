using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Profile.Dtos;
using MediatR;

namespace DMGoTravel.Application.Features.Profile.GetProfile;

public sealed record GetProfileQuery : IRequest<ProfileDto>;

public sealed class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, ProfileDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;

    public GetProfileQueryHandler(ICurrentUser currentUser, IUserRepository users)
    {
        _currentUser = currentUser;
        _users = users;
    }

    public async Task<ProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAppException();
        }

        return new ProfileDto(
            user.PublicId,
            user.Email,
            user.Profile?.FullName ?? user.Email,
            user.Profile?.Phone,
            user.IsEmailVerified);
    }
}
