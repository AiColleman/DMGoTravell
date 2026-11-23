namespace DMGoTravel.Application.Features.Profile.Dtos;

public sealed record ProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    bool EmailVerified);
