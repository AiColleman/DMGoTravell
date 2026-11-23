namespace DMGoTravel.Application.Features.Profile.Dtos;

public sealed record PendingEmailChangeDto(
    string NewEmail,
    DateTime RequestedAt);

public sealed record ProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    bool EmailVerified,
    PendingEmailChangeDto? PendingEmailChange = null);

public sealed record ProfileResult(
    ProfileDto Profile,
    long Version);
