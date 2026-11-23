using DMGoTravel.Domain.Modules.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public class PaymentAttemptConfiguration : IEntityTypeConfiguration<PaymentAttempt>
{
    public void Configure(EntityTypeBuilder<PaymentAttempt> builder)
    {
        builder.ToTable("payment_attempt");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).UseIdentityAlwaysColumn();
        builder.HasIndex(p => p.PublicId).IsUnique();
        builder.HasIndex(p => new { p.ReservationId, p.Status });
        builder.HasIndex(p => new { p.AccountId, p.CreatedAtUtc });

        builder.Property(p => p.Method).HasMaxLength(50).IsRequired();
        builder.Property(p => p.ProviderRequestRef).HasMaxLength(200);
        builder.Property(p => p.RowVersion).IsConcurrencyToken();

        builder.OwnsOne(p => p.Amount, m =>
        {
            m.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2).IsRequired();
            m.Ignore(x => x.Currency);
        });
    }
}

public class ExternalPaymentConfiguration : IEntityTypeConfiguration<ExternalPayment>
{
    public void Configure(EntityTypeBuilder<ExternalPayment> builder)
    {
        builder.ToTable("external_payment");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(e => new { e.Provider, e.ProviderTransactionId }).IsUnique();
        builder.HasIndex(e => e.AttemptId);
        builder.HasIndex(e => e.ReservationId);

        builder.Property(e => e.Provider).HasMaxLength(50).IsRequired();
        builder.Property(e => e.ProviderTransactionId).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Status).HasMaxLength(50).IsRequired();
        builder.Property(e => e.RowVersion).IsConcurrencyToken();

        builder.OwnsOne(e => e.Amount, m =>
        {
            m.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2).IsRequired();
            m.Ignore(x => x.Currency);
        });
    }
}

public class RefundCaseConfiguration : IEntityTypeConfiguration<RefundCase>
{
    public void Configure(EntityTypeBuilder<RefundCase> builder)
    {
        builder.ToTable("refund_case");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(r => r.PublicId).IsUnique();
        builder.HasIndex(r => r.ExternalPaymentId).IsUnique();
        builder.HasIndex(r => r.ReservationId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.ExecutedAtUtc);
        builder.HasIndex(r => r.ProviderRefundId);

        builder.Property(r => r.Status).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Reason).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.Provider).HasMaxLength(50).IsRequired();
        builder.Property(r => r.ProviderRefundId).HasMaxLength(200);
        builder.Property(r => r.LastError).HasMaxLength(1000);
        builder.Property(r => r.RowVersion).IsConcurrencyToken();

        builder.OwnsOne(r => r.Amount, m =>
        {
            m.Property(x => x.Amount).HasColumnName("amount").HasPrecision(14, 2).IsRequired();
            m.Ignore(x => x.Currency);
        });
    }
}

public class ProcessedWebhookEventConfiguration : IEntityTypeConfiguration<ProcessedWebhookEvent>
{
    public void Configure(EntityTypeBuilder<ProcessedWebhookEvent> builder)
    {
        builder.ToTable("processed_webhook_event");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(e => new { e.Provider, e.ExternalEventId }).IsUnique();
        builder.Property(e => e.Provider).HasMaxLength(50).IsRequired();
        builder.Property(e => e.ExternalEventId).HasMaxLength(200).IsRequired();
        builder.Property(e => e.EventType).HasMaxLength(100).IsRequired();
    }
}
