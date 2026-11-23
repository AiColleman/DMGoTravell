using DMGoTravel.Domain.Modules.Audit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public sealed class PendingAuditEntryConfiguration : IEntityTypeConfiguration<PendingAuditEntry>
{
    public void Configure(EntityTypeBuilder<PendingAuditEntry> builder)
    {
        builder.ToTable("pending_audit_record");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(p => p.PublicId).IsUnique();
        builder.HasIndex(p => new { p.Status, p.NextRetryAtUtc });

        builder.Property(p => p.Origin).HasMaxLength(100).IsRequired();
        builder.Property(p => p.OperationId).HasMaxLength(100).IsRequired();
        builder.Property(p => p.ActorType).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Action).HasMaxLength(100).IsRequired();
        builder.Property(p => p.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(p => p.EntityId).HasMaxLength(100).IsRequired();
        builder.Property(p => p.CorrelationId).HasMaxLength(100);
        builder.Property(p => p.Result).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Status).HasMaxLength(30).IsRequired();
        builder.Property(p => p.LastError).HasMaxLength(500);
        builder.Property(p => p.RowVersion).IsConcurrencyToken();
    }
}
