using DMGoTravel.Domain.Modules.Mobility;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public sealed class MobilityItemConfiguration : IEntityTypeConfiguration<MobilityItem>
{
    public void Configure(EntityTypeBuilder<MobilityItem> builder)
    {
        builder.ToTable("mobility_category");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(m => m.PublicId).IsUnique();
        builder.HasIndex(m => new { m.IsActive, m.NormalizedKey });

        builder.Property(m => m.Name).HasMaxLength(150).IsRequired();
        builder.Property(m => m.NormalizedKey).HasMaxLength(150).IsRequired();
        builder.Property(m => m.Description).IsRequired();
        builder.Property(m => m.Type).HasMaxLength(50).IsRequired();
        builder.Property(m => m.ImageUrl).HasMaxLength(1000);
        builder.Property(m => m.ImageContentType).HasMaxLength(100);
        builder.Property(m => m.RowVersion).IsConcurrencyToken();
    }
}
