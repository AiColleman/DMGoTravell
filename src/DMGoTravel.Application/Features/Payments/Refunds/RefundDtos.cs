using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Application.Features.Payments.Refunds;

public sealed record RefundCaseDto(
    Guid Id,
    Guid ReservationId,
    Guid PaymentId,
    string Amount,
    string Currency,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    object? Evidence,
    long Version);

public sealed record RefundCasePageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasMore,
    IReadOnlyList<RefundCaseDto> Items);

public sealed record WebhookAckDto(bool Received, bool Duplicate);

public static class RefundCaseMapper
{
    public static RefundCaseDto ToDto(RefundCaseSummaryRecord record)
    {
        var refund = record.Refund;
        object? evidence = null;
        if (!string.IsNullOrWhiteSpace(refund.EvidenceJson))
        {
            try
            {
                evidence = JsonSerializer.Deserialize<Dictionary<string, object?>>(refund.EvidenceJson);
            }
            catch (JsonException)
            {
                evidence = null;
            }
        }
        else if (!string.IsNullOrWhiteSpace(refund.ProviderRefundId))
        {
            evidence = new Dictionary<string, object?>
            {
                ["provider"] = refund.Provider,
                ["providerRefundId"] = refund.ProviderRefundId,
                ["executedAt"] = refund.ExecutedAtUtc.HasValue
                    ? DateTime.SpecifyKind(refund.ExecutedAtUtc.Value, DateTimeKind.Utc)
                    : null
            };
        }

        return new RefundCaseDto(
            refund.PublicId,
            record.ReservationPublicId,
            record.PaymentAttemptPublicId,
            refund.Amount.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            refund.Amount.Currency,
            refund.Status,
            DateTime.SpecifyKind(refund.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(refund.UpdatedAtUtc ?? refund.CreatedAtUtc, DateTimeKind.Utc),
            evidence,
            refund.RowVersion);
    }
}
