using DMGoTravel.Domain.Modules.Exports;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public sealed class ExportJobConfiguration : IEntityTypeConfiguration<ExportJob>
{
    public void Configure(EntityTypeBuilder<ExportJob> builder)
    {
        builder.ToTable("export_job");

        builder.HasKey(job => job.Id);
        builder.Property(job => job.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(job => job.PublicId).IsUnique();
        builder.HasIndex(job => new { job.RequestedByPublicId, job.CreatedAtUtc });
        builder.HasIndex(job => job.ExpiresAtUtc);

        builder.Property(job => job.Kind).HasMaxLength(20).IsRequired();
        builder.Property(job => job.Status).HasMaxLength(30).IsRequired();
        builder.Property(job => job.RequestedByPublicId).IsRequired();
        builder.Property(job => job.ReferenceAtUtc).IsRequired();
        builder.Property(job => job.ExpiresAtUtc).IsRequired();
        builder.Property(job => job.FileName).HasMaxLength(200).IsRequired();
        builder.Property(job => job.CsvContent).IsRequired();
        builder.Property(job => job.SnapshotContent);
        builder.Property(job => job.RowCount).IsRequired();
        builder.Property(job => job.ContentHash).HasMaxLength(64).IsRequired();
        builder.Property(job => job.FiltersJson).IsRequired();
        builder.Property(job => job.RowVersion).IsConcurrencyToken();
    }
}
