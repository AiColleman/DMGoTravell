using DMGoTravel.Domain.Modules.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public class NotificationDeliveryConfiguration : IEntityTypeConfiguration<NotificationDelivery>
{
    public void Configure(EntityTypeBuilder<NotificationDelivery> builder)
    {
        builder.ToTable("notification_delivery");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(d => d.PublicId).IsUnique();
        builder.HasIndex(d => d.ProviderMessageId);
        builder.HasIndex(d => new { d.Status, d.NextRetryAtUtc });

        builder.Property(d => d.Template).HasMaxLength(100).IsRequired();
        builder.Property(d => d.RecipientEmail).HasMaxLength(320).IsRequired();
        builder.Property(d => d.RecipientMasked).HasMaxLength(320).IsRequired();
        builder.Property(d => d.Subject).HasMaxLength(300).IsRequired();
        builder.Property(d => d.BodySummary).HasMaxLength(2000).IsRequired();
        builder.Property(d => d.Status).HasMaxLength(50).IsRequired();
        builder.Property(d => d.Provider).HasMaxLength(50).IsRequired();
        builder.Property(d => d.ProviderMessageId).HasMaxLength(200);
        builder.Property(d => d.LastError).HasMaxLength(1000);
        builder.Property(d => d.CorrelationId).HasMaxLength(100);
        builder.Property(d => d.RowVersion).IsConcurrencyToken();
    }
}

public class NotificationIncidentConfiguration : IEntityTypeConfiguration<NotificationIncident>
{
    public void Configure(EntityTypeBuilder<NotificationIncident> builder)
    {
        builder.ToTable("notification_incident");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(i => i.PublicId).IsUnique();
        builder.HasIndex(i => i.DeliveryId);
        builder.HasIndex(i => new { i.Status, i.CreatedAtUtc });

        builder.Property(i => i.Type).HasMaxLength(50).IsRequired();
        builder.Property(i => i.Status).HasMaxLength(50).IsRequired();
        builder.Property(i => i.RecipientMasked).HasMaxLength(320).IsRequired();
        builder.Property(i => i.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(i => i.RowVersion).IsConcurrencyToken();
    }
}
