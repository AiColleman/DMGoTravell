using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Reports;
using DMGoTravel.Domain.Modules.Reservations;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence.Repositories;

public sealed class ReportRepository : IReportRepository
{
    private readonly ApplicationDbContext _db;

    public ReportRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<ReportReservationSourceRow> Reservations, IReadOnlyList<ReportPaymentSourceRow> Payments)> CaptureSourcesAsync(
        DateTime fromUtc,
        DateTime toUtcExclusive,
        Guid? offerId,
        Guid? hotelId,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var reservationsQuery = _db.Reservations
            .AsNoTracking()
            .Include(r => r.OfferSnapshot)
            .Include(r => r.LodgingSnapshot)
            .Where(r => r.CreatedAtUtc >= fromUtc && r.CreatedAtUtc < toUtcExclusive);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ReservationStatus>(status, ignoreCase: true, out var parsedStatus))
        {
            reservationsQuery = reservationsQuery.Where(r => r.Status == parsedStatus);
        }

        if (offerId.HasValue)
        {
            reservationsQuery = reservationsQuery.Where(r =>
                _db.Offers.Any(o => o.Id == r.OfferId && o.PublicId == offerId.Value));
        }

        if (hotelId.HasValue)
        {
            reservationsQuery = reservationsQuery.Where(r =>
                r.LodgingSnapshot != null &&
                _db.LodgingProposals.Any(p =>
                    p.Id == r.LodgingSnapshot.ProposalId &&
                    _db.Hotels.Any(h => h.Id == p.HotelId && h.PublicId == hotelId.Value)));
        }

        var reservations = await reservationsQuery
            .OrderByDescending(r => r.CreatedAtUtc)
            .ThenByDescending(r => r.Id)
            .ToListAsync(cancellationToken);

        var offerIds = reservations.Select(r => r.OfferId).Distinct().ToList();
        var offerMap = offerIds.Count == 0
            ? new Dictionary<long, Guid>()
            : await _db.Offers.AsNoTracking()
                .Where(o => offerIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.PublicId, cancellationToken);

        var proposalIds = reservations
            .Where(r => r.LodgingSnapshot is not null)
            .Select(r => r.LodgingSnapshot!.ProposalId)
            .Distinct()
            .ToList();

        var proposalHotelMap = proposalIds.Count == 0
            ? new Dictionary<long, Guid>()
            : await (from p in _db.LodgingProposals.AsNoTracking()
                     join h in _db.Hotels.AsNoTracking() on p.HotelId equals h.Id
                     where proposalIds.Contains(p.Id)
                     select new { p.Id, h.PublicId })
                .ToDictionaryAsync(x => x.Id, x => x.PublicId, cancellationToken);

        var reservationRows = reservations.Select(r => new ReportReservationSourceRow(
            r.PublicId,
            r.ReservationNumber,
            r.Status.ToString().ToLowerInvariant(),
            offerMap.GetValueOrDefault(r.OfferId),
            r.OfferSnapshot?.OfferName ?? "Oferta",
            r.OfferSnapshot?.OfferType ?? "tour",
            r.LodgingSnapshot is null ? null : proposalHotelMap.GetValueOrDefault(r.LodgingSnapshot.ProposalId),
            r.LodgingSnapshot?.HotelName,
            r.OfferSnapshot?.Travelers ?? 0,
            r.TouristSubtotal.Amount,
            r.LodgingSubtotal.Amount,
            r.Total.Amount,
            r.Total.Currency,
            DateTime.SpecifyKind(r.CreatedAtUtc, DateTimeKind.Utc),
            r.OfferSnapshot is null ? null : DateTime.SpecifyKind(r.OfferSnapshot.DepartureStartsAtUtc, DateTimeKind.Utc),
            r.OfferSnapshot is null ? null : DateTime.SpecifyKind(r.OfferSnapshot.DepartureEndsAtUtc, DateTimeKind.Utc)))
            .ToList();

        // Bloque financiero (011/RF-18): cobros reales confirmados cuya fecha confirmada está en el período,
        // respetando filtros de oferta/hotel sobre la reserva relacionada (011/RF-7).
        var paymentsQuery =
            from ext in _db.ExternalPayments.AsNoTracking()
            join r in _db.Reservations.AsNoTracking() on ext.ReservationId equals r.Id
            where ext.OccurredAtUtc >= fromUtc &&
                  ext.OccurredAtUtc < toUtcExclusive &&
                  ext.Status == "approved"
            select new { ext, r };

        if (offerId.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(x =>
                _db.Offers.Any(o => o.Id == x.r.OfferId && o.PublicId == offerId.Value));
        }

        if (hotelId.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(x =>
                x.r.LodgingSnapshot != null &&
                _db.LodgingProposals.Any(p =>
                    p.Id == x.r.LodgingSnapshot.ProposalId &&
                    _db.Hotels.Any(h => h.Id == p.HotelId && h.PublicId == hotelId.Value)));
        }

        var payments = await paymentsQuery
            .Select(x => new ReportPaymentSourceRow(
                x.ext.PublicId,
                x.ext.ProviderTransactionId,
                x.ext.Amount.Amount,
                x.ext.Amount.Currency,
                x.ext.Status,
                DateTime.SpecifyKind(x.ext.OccurredAtUtc, DateTimeKind.Utc)))
            .ToListAsync(cancellationToken);

        return (reservationRows, payments);
    }

    public Task AddAsync(ReportSnapshot snapshot, CancellationToken cancellationToken = default) =>
        _db.ReportSnapshots.AddAsync(snapshot, cancellationToken).AsTask();

    public Task<ReportSnapshot?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default) =>
        _db.ReportSnapshots.SingleOrDefaultAsync(r => r.PublicId == publicId, cancellationToken);
}
