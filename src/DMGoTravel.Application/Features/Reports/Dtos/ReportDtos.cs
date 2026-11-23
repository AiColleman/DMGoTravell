namespace DMGoTravel.Application.Features.Reports.Dtos;

public sealed record ReportOfferBreakdownDto(
    Guid OfferId,
    string OfferName,
    string OfferType,
    int Reservations,
    int Travelers,
    string TouristSubtotal,
    string Currency);

public sealed record ReportHotelBreakdownDto(
    Guid HotelId,
    string HotelName,
    int Reservations,
    string LodgingSubtotal,
    string Currency);

public sealed record ReportCurrencyMovementDto(
    string Currency,
    string ConfirmedPayments,
    string ExecutedRefunds,
    string NetDifference,
    int PaymentCount,
    int RefundCount);

public sealed record ReportSummaryDto(
    DateOnly From,
    DateOnly To,
    int TotalReservations,
    int PendingCount,
    int ConfirmedCount,
    int CompletedCount,
    int CancelledCount,
    int TotalTravelers,
    string ContractedTouristTotal,
    string ContractedLodgingTotal,
    string ContractedTotal,
    string ContractedCurrency,
    IReadOnlyList<ReportOfferBreakdownDto> ByOffer,
    IReadOnlyList<ReportHotelBreakdownDto> ByHotel,
    IReadOnlyList<ReportCurrencyMovementDto> FinancialMovements);

public sealed record ReportRowDto(
    Guid ReservationId,
    string ReservationNumber,
    string Status,
    string OfferName,
    string? HotelName,
    int Travelers,
    string TouristSubtotal,
    string LodgingSubtotal,
    string Total,
    string Currency,
    DateTime CreatedAt);

public sealed record ReportRowPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<ReportRowDto> Items);

public sealed record ReportDetailDto(
    Guid Id,
    DateTime ReferenceAt,
    string Status,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    int RowsCount,
    string PdfStatus,
    ReportSummaryDto Summary);

public sealed record ReportPdfDownloadDto(
    byte[] Content,
    string FileName,
    DateTime ReferenceAtUtc);
