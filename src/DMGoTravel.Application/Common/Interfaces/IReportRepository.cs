using DMGoTravel.Domain.Modules.Reports;

namespace DMGoTravel.Application.Common.Interfaces;

public sealed record ReportReservationSourceRow(
    Guid ReservationPublicId,
    string ReservationNumber,
    string Status,
    Guid OfferPublicId,
    string OfferName,
    string OfferType,
    Guid? HotelPublicId,
    string? HotelName,
    int Travelers,
    decimal TouristSubtotal,
    decimal LodgingSubtotal,
    decimal Total,
    string Currency,
    DateTime CreatedAtUtc,
    DateTime? DepartureStartsAtUtc,
    DateTime? DepartureEndsAtUtc);

public sealed record ReportPaymentSourceRow(
    Guid PaymentPublicId,
    string ProviderReference,
    decimal Amount,
    string Currency,
    string Status,
    DateTime ConfirmedAtUtc);

public sealed record ReportRefundSourceRow(
    Guid RefundPublicId,
    decimal Amount,
    string Currency,
    DateTime ExecutedAtUtc);

public interface IReportRepository
{
    Task<(IReadOnlyList<ReportReservationSourceRow> Reservations, IReadOnlyList<ReportPaymentSourceRow> Payments, IReadOnlyList<ReportRefundSourceRow> Refunds)> CaptureSourcesAsync(
        DateTime fromUtc,
        DateTime toUtcExclusive,
        Guid? offerId,
        Guid? hotelId,
        string? status,
        CancellationToken cancellationToken = default);

    Task AddAsync(ReportSnapshot snapshot, CancellationToken cancellationToken = default);
    Task<ReportSnapshot?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
}
