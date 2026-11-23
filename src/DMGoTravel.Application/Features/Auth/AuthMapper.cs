using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Features.Auth;

internal static class AuthMapper
{
    public static UserSummaryDto ToSummary(User user) => new(
        user.PublicId,
        user.Email,
        user.Profile?.FullName ?? user.Email,
        user.Role,
        user.IsEmailVerified);
}
