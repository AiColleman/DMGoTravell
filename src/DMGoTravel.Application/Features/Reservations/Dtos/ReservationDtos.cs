using DMGoTravel.Application.Features.Catalog.Dtos;

namespace DMGoTravel.Application.Features.Reservations.Dtos;

public sealed record ReservationDto(
    Guid Id,
    string ReservationNumber,
    string Status,
    DepartureDto? Departure,
    object? Lodging,
    int Travelers,
    string Total,
    string Currency,
    DateTime PaymentDeadlineAt,
    DateTime ValidationDeadlineAt,
    long Version,
    string? OfferNameHint = null);

public sealed record ReservationPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<ReservationDto> Items);
