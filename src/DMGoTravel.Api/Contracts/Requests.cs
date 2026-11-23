namespace DMGoTravel.Api.Contracts;

public sealed record RegisterRequest(string Email, string Password, string FullName, string? Phone);

public sealed record LoginRequest(string Email, string Password);

public sealed record VerifyEmailRequest(string Token);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Token, string NewPassword);

public sealed record LodgingRequest(Guid ProposalId, Guid RoomTypeId);

public sealed record CreateReservationRequest(
    Guid DepartureId,
    int Travelers,
    LodgingRequest? Lodging = null);

public sealed record CancelReservationRequest(long? Version = null);

public sealed record StartPaymentRequest(string Method);
