namespace DMGoTravel.Application.Features.Auth.Dtos;

public sealed record UserSummaryDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    bool EmailVerified);

public sealed record AuthSessionDto(
    string AccessToken,
    string TokenType,
    int ExpiresIn,
    UserSummaryDto User);

public sealed record AuthResult(
    AuthSessionDto Session,
    string RefreshToken,
    DateTime RefreshExpiresAtUtc,
    string CsrfToken);

public sealed record OperationResultDto(Guid Id, string Status, long Version);

public sealed record OperationAcceptedDto(
    Guid Id,
    string Status,
    DateTime ReferenceAt,
    DateTime ExpiresAt);
