using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Reports;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public sealed class ReportsAndPendingAuditDomainTests
{
    [Fact(DisplayName = "PendingAuditEntry 010/RF-40-RF-41: aplica backoff y dispara alerta al agotar reintentos")]
    public void PendingAuditEntry_RetriesAndAlertEscalation_ShouldWork()
    {
        var now = new DateTime(2026, 11, 23, 17, 0, 0, DateTimeKind.Utc);
        var entry = PendingAuditEntry.Create(
            "api",
            "payments.start",
            "human",
            42,
            "payments.start",
            "payment",
            Guid.NewGuid().ToString(),
            now,
            "corr-1",
            "success",
            "{}",
            "Fallo inicial",
            now,
            maxRetries: 2);

        entry.Status.Should().Be(PendingAuditEntry.StatusPending);

        var alert1 = entry.RecordFailure("Timeout DB 1", now.AddSeconds(5));
        alert1.Should().BeFalse();
        entry.Status.Should().Be(PendingAuditEntry.StatusPending);
        entry.RetryCount.Should().Be(1);
        entry.NextRetryAtUtc.Should().BeAfter(now.AddSeconds(5));

        var alert2 = entry.RecordFailure("Timeout DB 2", now.AddMinutes(1));
        alert2.Should().BeTrue();
        entry.Status.Should().Be(PendingAuditEntry.StatusAlerted);
        entry.RetryCount.Should().Be(2);
    }

    [Fact(DisplayName = "ReportSnapshot 011: controla expiración y adjunta PDF listo")]
    public void ReportSnapshot_ExpirationAndPdfAttachment_ShouldWork()
    {
        var now = new DateTime(2026, 11, 23, 17, 0, 0, DateTimeKind.Utc);
        var snapshot = ReportSnapshot.Create(
            Guid.NewGuid(),
            now,
            now.AddHours(24),
            rowsCount: 3,
            "{}",
            "{}",
            "[]");

        snapshot.PdfStatus.Should().Be(ReportSnapshot.PdfNotRequested);
        snapshot.IsExpired(now.AddHours(23)).Should().BeFalse();
        snapshot.IsExpired(now.AddHours(24)).Should().BeTrue();

        snapshot.AttachPdf("%PDF-1.4\n%%EOF"u8.ToArray(), "dmgo-report.pdf", now.AddMinutes(1));
        snapshot.PdfStatus.Should().Be(ReportSnapshot.PdfReady);
        snapshot.PdfFileName.Should().Be("dmgo-report.pdf");
    }
}
