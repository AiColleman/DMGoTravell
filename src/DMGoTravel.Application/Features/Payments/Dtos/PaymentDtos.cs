namespace DMGoTravel.Application.Features.Payments.Dtos;

public sealed record PaymentAttemptDto(
    Guid Id,
    Guid ReservationId,
    string Method,
    string Status,
    string Amount,
    string Currency,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    long Version);

public sealed record PaymentStartResponseDto(
    PaymentAttemptDto Payment,
    object? ProviderData);
