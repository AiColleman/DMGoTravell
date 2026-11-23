using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Idempotency;

public sealed class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
    {
        builder.ToTable("idempotency_record");

        builder.HasKey(record => record.Id);
        builder.Property(record => record.Id).HasColumnName("id").UseIdentityAlwaysColumn();

        builder.Property(record => record.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(record => record.Scope).HasColumnName("scope").HasMaxLength(100).IsRequired();
        builder.Property(record => record.Key).HasColumnName("key").HasMaxLength(128).IsRequired();
        builder.Property(record => record.RequestHash).HasColumnName("request_hash").HasMaxLength(64).IsRequired();
        builder.Property(record => record.ResponseJson).HasColumnName("response_json");
        builder.Property(record => record.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(record => record.CompletedAtUtc).HasColumnName("completed_at_utc");
        builder.Property(record => record.ExpiresAtUtc).HasColumnName("expires_at_utc").IsRequired();

        builder.HasIndex(record => new { record.UserId, record.Scope, record.Key }).IsUnique();
        builder.HasIndex(record => record.ExpiresAtUtc);
    }
}
