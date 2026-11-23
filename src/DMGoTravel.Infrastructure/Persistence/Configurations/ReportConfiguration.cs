using DMGoTravel.Domain.Modules.Reports;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public sealed class ReportSnapshotConfiguration : IEntityTypeConfiguration<ReportSnapshot>
{
    public void Configure(EntityTypeBuilder<ReportSnapshot> builder)
    {
        builder.ToTable("report_snapshot");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(r => r.PublicId).IsUnique();
        builder.HasIndex(r => r.ExpiresAtUtc);
        builder.HasIndex(r => new { r.RequestedByPublicId, r.CreatedAtUtc });

        builder.Property(r => r.Status).HasMaxLength(30).IsRequired();
        builder.Property(r => r.PdfStatus).HasMaxLength(30).IsRequired();
        builder.Property(r => r.FiltersJson).IsRequired();
        builder.Property(r => r.SummaryJson).IsRequired();
        builder.Property(r => r.RowsJson).IsRequired();
        builder.Property(r => r.PdfFileName).HasMaxLength(200);
        builder.Property(r => r.RowVersion).IsConcurrencyToken();
    }
}
