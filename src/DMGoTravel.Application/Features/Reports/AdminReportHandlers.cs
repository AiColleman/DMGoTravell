using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Application.Features.Reports.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Reports;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Reports;

public sealed record CreateAdminReportCommand(
    DateOnly From,
    DateOnly To,
    Guid? OfferId,
    Guid? HotelId,
    string? Status,
    string IdempotencyKey) : IRequest<OperationAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.reports.create";
    public string GetRequestFingerprint() =>
        $"{From:yyyy-MM-dd}|{To:yyyy-MM-dd}|{OfferId?.ToString("N") ?? "-"}|{HotelId?.ToString("N") ?? "-"}|{Status ?? "-"}";
}

public sealed class CreateAdminReportCommandValidator : AbstractValidator<CreateAdminReportCommand>
{
    public CreateAdminReportCommandValidator()
    {
        RuleFor(c => c.To)
            .GreaterThanOrEqualTo(c => c.From)
            .WithMessage("El rango de fechas no es válido.");

        RuleFor(c => c.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) ||
                       s.Trim().ToLowerInvariant() is "pending" or "confirmed" or "completed" or "cancelled")
            .WithMessage("El filtro de estado no es válido.");

        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class CreateAdminReportCommandHandler : IRequestHandler<CreateAdminReportCommand, OperationAcceptedDto>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAdminAccessGuard _adminAccess;
    private readonly ICurrentUser _currentUser;
    private readonly IReportRepository _reports;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;

    public CreateAdminReportCommandHandler(
        IAdminAccessGuard adminAccess,
        ICurrentUser currentUser,
        IReportRepository reports,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork)
    {
        _adminAccess = adminAccess;
        _currentUser = currentUser;
        _reports = reports;
        _clock = clock;
        _unitOfWork = unitOfWork;
    }

    public async Task<OperationAcceptedDto> Handle(CreateAdminReportCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);

        var referenceAt = _clock.UtcNow;
        var expiresAt = referenceAt.AddHours(24);
        var fromUtc = _clock.ToUtcStartOfDay(request.From);
        var toUtcExclusive = _clock.ToUtcStartOfNextDay(request.To);

        var (reservations, payments) = await _reports.CaptureSourcesAsync(
            fromUtc,
            toUtcExclusive,
            request.OfferId,
            request.HotelId,
            request.Status,
            cancellationToken);

        var rows = reservations.Select(r => new ReportRowDto(
            r.ReservationPublicId,
            r.ReservationNumber,
            r.Status,
            r.OfferName,
            r.HotelName,
            r.Travelers,
            r.TouristSubtotal.ToString("0.00", CultureInfo.InvariantCulture),
            r.LodgingSubtotal.ToString("0.00", CultureInfo.InvariantCulture),
            r.Total.ToString("0.00", CultureInfo.InvariantCulture),
            r.Currency,
            r.CreatedAtUtc)).ToList();

        var byOffer = reservations
            .GroupBy(r => new { r.OfferPublicId, r.OfferName, r.OfferType })
            .OrderBy(g => g.Key.OfferName)
            .Select(g => new ReportOfferBreakdownDto(
                g.Key.OfferPublicId,
                g.Key.OfferName,
                g.Key.OfferType,
                g.Count(),
                g.Sum(x => x.Travelers),
                g.Sum(x => x.TouristSubtotal).ToString("0.00", CultureInfo.InvariantCulture),
                Money.DefaultCurrency))
            .ToList();

        var byHotel = reservations
            .Where(r => r.HotelPublicId.HasValue && !string.IsNullOrWhiteSpace(r.HotelName))
            .GroupBy(r => new { HotelId = r.HotelPublicId!.Value, HotelName = r.HotelName! })
            .OrderBy(g => g.Key.HotelName)
            .Select(g => new ReportHotelBreakdownDto(
                g.Key.HotelId,
                g.Key.HotelName,
                g.Count(),
                g.Sum(x => x.LodgingSubtotal).ToString("0.00", CultureInfo.InvariantCulture),
                Money.DefaultCurrency))
            .ToList();

        var movements = payments
            .GroupBy(p => p.Currency)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var confirmedSum = g.Sum(x => x.Amount);
                var refundSum = 0m;
                var diff = confirmedSum - refundSum;
                return new ReportCurrencyMovementDto(
                    g.Key,
                    confirmedSum.ToString("0.00", CultureInfo.InvariantCulture),
                    refundSum.ToString("0.00", CultureInfo.InvariantCulture),
                    diff.ToString("0.00", CultureInfo.InvariantCulture),
                    g.Count(),
                    0);
            })
            .ToList();

        var touristTotal = reservations.Sum(r => r.TouristSubtotal);
        var lodgingTotal = reservations.Sum(r => r.LodgingSubtotal);

        var summary = new ReportSummaryDto(
            request.From,
            request.To,
            reservations.Count,
            reservations.Count(r => r.Status == "pending"),
            reservations.Count(r => r.Status == "confirmed"),
            reservations.Count(r => r.Status == "completed"),
            reservations.Count(r => r.Status == "cancelled"),
            reservations.Sum(r => r.Travelers),
            touristTotal.ToString("0.00", CultureInfo.InvariantCulture),
            lodgingTotal.ToString("0.00", CultureInfo.InvariantCulture),
            (touristTotal + lodgingTotal).ToString("0.00", CultureInfo.InvariantCulture),
            Money.DefaultCurrency,
            byOffer,
            byHotel,
            movements);

        var filtersJson = JsonSerializer.Serialize(new
        {
            from = request.From.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            to = request.To.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            offerId = request.OfferId,
            hotelId = request.HotelId,
            status = request.Status
        }, JsonOptions);

        var snapshot = ReportSnapshot.Create(
            _currentUser.UserId!.Value,
            referenceAt,
            expiresAt,
            rows.Count,
            filtersJson,
            JsonSerializer.Serialize(summary, JsonOptions),
            JsonSerializer.Serialize(rows, JsonOptions));

        await _reports.AddAsync(snapshot, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationAcceptedDto(
            snapshot.PublicId,
            "accepted",
            DateTime.SpecifyKind(referenceAt, DateTimeKind.Utc),
            DateTime.SpecifyKind(expiresAt, DateTimeKind.Utc));
    }
}

public sealed record GetAdminReportQuery(Guid Id) : IRequest<ReportDetailDto>;

public sealed class GetAdminReportQueryHandler : IRequestHandler<GetAdminReportQuery, ReportDetailDto>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAdminAccessGuard _adminAccess;
    private readonly IReportRepository _reports;
    private readonly IDateTimeProvider _clock;

    public GetAdminReportQueryHandler(
        IAdminAccessGuard adminAccess,
        IReportRepository reports,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _reports = reports;
        _clock = clock;
    }

    public async Task<ReportDetailDto> Handle(GetAdminReportQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var report = await _reports.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El reporte no existe.");

        if (report.IsExpired(_clock.UtcNow))
        {
            throw new ReportExpiredAppException();
        }

        var summary = JsonSerializer.Deserialize<ReportSummaryDto>(report.SummaryJson, JsonOptions)!;
        return new ReportDetailDto(
            report.PublicId,
            DateTime.SpecifyKind(report.ReferenceAtUtc, DateTimeKind.Utc),
            report.Status,
            DateTime.SpecifyKind(report.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(report.ExpiresAtUtc, DateTimeKind.Utc),
            report.RowsCount,
            report.PdfStatus,
            summary);
    }
}

public sealed record GetAdminReportRowsQuery(Guid Id, int Page = 1, int PageSize = 10) : IRequest<ReportRowPageDto>;

public sealed class GetAdminReportRowsQueryValidator : AbstractValidator<GetAdminReportRowsQuery>
{
    public GetAdminReportRowsQueryValidator()
    {
        RuleFor(q => q.Id).NotEmpty();
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetAdminReportRowsQueryHandler : IRequestHandler<GetAdminReportRowsQuery, ReportRowPageDto>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAdminAccessGuard _adminAccess;
    private readonly IReportRepository _reports;
    private readonly IDateTimeProvider _clock;

    public GetAdminReportRowsQueryHandler(
        IAdminAccessGuard adminAccess,
        IReportRepository reports,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _reports = reports;
        _clock = clock;
    }

    public async Task<ReportRowPageDto> Handle(GetAdminReportRowsQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var report = await _reports.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El reporte no existe.");

        if (report.IsExpired(_clock.UtcNow))
        {
            throw new ReportExpiredAppException();
        }

        var allRows = JsonSerializer.Deserialize<List<ReportRowDto>>(report.RowsJson, JsonOptions) ?? [];
        var pageItems = allRows
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        return new ReportRowPageDto(
            request.Page,
            request.PageSize,
            allRows.Count,
            (long)request.Page * request.PageSize < allRows.Count,
            pageItems);
    }
}

public sealed record RequestAdminReportPdfCommand(Guid Id, string IdempotencyKey)
    : IRequest<OperationAcceptedDto>, IIdempotentCommand
{
    public string IdempotencyScope => "admin.reports.requestPdf";
    public string GetRequestFingerprint() => Id.ToString("N");
}

public sealed class RequestAdminReportPdfCommandValidator : AbstractValidator<RequestAdminReportPdfCommand>
{
    public RequestAdminReportPdfCommandValidator()
    {
        RuleFor(c => c.Id).NotEmpty();
        RuleFor(c => c.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class RequestAdminReportPdfCommandHandler
    : IRequestHandler<RequestAdminReportPdfCommand, OperationAcceptedDto>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAdminAccessGuard _adminAccess;
    private readonly IReportRepository _reports;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;

    public RequestAdminReportPdfCommandHandler(
        IAdminAccessGuard adminAccess,
        IReportRepository reports,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork)
    {
        _adminAccess = adminAccess;
        _reports = reports;
        _clock = clock;
        _unitOfWork = unitOfWork;
    }

    public async Task<OperationAcceptedDto> Handle(RequestAdminReportPdfCommand request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var report = await _reports.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El reporte no existe.");

        var now = _clock.UtcNow;
        if (report.IsExpired(now))
        {
            throw new ReportExpiredAppException();
        }

        if (report.PdfStatus != ReportSnapshot.PdfReady || report.PdfBytes is null)
        {
            var summary = JsonSerializer.Deserialize<ReportSummaryDto>(report.SummaryJson, JsonOptions)!;
            var rows = JsonSerializer.Deserialize<List<ReportRowDto>>(report.RowsJson, JsonOptions) ?? [];
            var pdfBytes = ReportPdfBuilder.Build(report.PublicId, report.ReferenceAtUtc, summary, rows);
            var fileName = $"dmgo-report-{summary.From:yyyyMMdd}-{summary.To:yyyyMMdd}.pdf";
            report.AttachPdf(pdfBytes, fileName, now);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new OperationAcceptedDto(
            report.PublicId,
            "accepted",
            DateTime.SpecifyKind(report.ReferenceAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(report.ExpiresAtUtc, DateTimeKind.Utc));
    }
}

public sealed record DownloadAdminReportPdfQuery(Guid Id) : IRequest<ReportPdfDownloadDto>;

public sealed class DownloadAdminReportPdfQueryHandler
    : IRequestHandler<DownloadAdminReportPdfQuery, ReportPdfDownloadDto>
{
    private readonly IAdminAccessGuard _adminAccess;
    private readonly IReportRepository _reports;
    private readonly IDateTimeProvider _clock;

    public DownloadAdminReportPdfQueryHandler(
        IAdminAccessGuard adminAccess,
        IReportRepository reports,
        IDateTimeProvider clock)
    {
        _adminAccess = adminAccess;
        _reports = reports;
        _clock = clock;
    }

    public async Task<ReportPdfDownloadDto> Handle(DownloadAdminReportPdfQuery request, CancellationToken cancellationToken)
    {
        await _adminAccess.EnsureAdminAsync(cancellationToken);
        var report = await _reports.GetByPublicIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundAppException("El reporte no existe.");

        if (report.IsExpired(_clock.UtcNow))
        {
            throw new ReportExpiredAppException();
        }

        if (report.PdfStatus != ReportSnapshot.PdfReady || report.PdfBytes is null || string.IsNullOrWhiteSpace(report.PdfFileName))
        {
            throw new ReportNotReadyAppException();
        }

        return new ReportPdfDownloadDto(
            report.PdfBytes,
            report.PdfFileName,
            DateTime.SpecifyKind(report.ReferenceAtUtc, DateTimeKind.Utc));
    }
}
