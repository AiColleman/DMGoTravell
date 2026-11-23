using DMGoTravel.Domain.Modules.Reservations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("reservation");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(r => r.PublicId).IsUnique();
        builder.HasIndex(r => r.ReservationNumber).IsUnique();
        builder.HasIndex(r => new { r.AccountId, r.CreatedAtUtc });

        builder.Property(r => r.ReservationNumber).HasMaxLength(50).IsRequired();
        builder.Property(r => r.RowVersion).IsConcurrencyToken();

        builder.OwnsOne(r => r.TouristSubtotal, p =>
        {
            p.Property(m => m.Amount).HasColumnName("tourist_subtotal").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });

        builder.OwnsOne(r => r.LodgingSubtotal, p =>
        {
            p.Property(m => m.Amount).HasColumnName("lodging_subtotal").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });

        builder.OwnsOne(r => r.Total, p =>
        {
            p.Property(m => m.Amount).HasColumnName("total").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });

        builder.HasOne(r => r.OfferSnapshot)
            .WithOne()
            .HasForeignKey<ReservationOfferSnapshot>(s => s.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.LodgingSnapshot)
            .WithOne()
            .HasForeignKey<ReservationLodgingSnapshot>(s => s.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Holds)
            .WithOne()
            .HasForeignKey(h => h.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ReservationOfferSnapshotConfiguration : IEntityTypeConfiguration<ReservationOfferSnapshot>
{
    public void Configure(EntityTypeBuilder<ReservationOfferSnapshot> builder)
    {
        builder.ToTable("reservation_offer_snapshot");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).UseIdentityAlwaysColumn();

        builder.Property(s => s.OfferType).HasMaxLength(50).IsRequired();
        builder.Property(s => s.OfferName).HasMaxLength(200).IsRequired();

        builder.OwnsOne(s => s.PricePerPerson, p =>
        {
            p.Property(m => m.Amount).HasColumnName("price_per_person").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });

        builder.OwnsOne(s => s.Subtotal, p =>
        {
            p.Property(m => m.Amount).HasColumnName("subtotal").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });
    }
}

public class ReservationLodgingSnapshotConfiguration : IEntityTypeConfiguration<ReservationLodgingSnapshot>
{
    public void Configure(EntityTypeBuilder<ReservationLodgingSnapshot> builder)
    {
        builder.ToTable("reservation_lodging_snapshot");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).UseIdentityAlwaysColumn();

        builder.Property(s => s.HotelName).HasMaxLength(200).IsRequired();
        builder.Property(s => s.RoomTypeName).HasMaxLength(150).IsRequired();

        builder.OwnsOne(s => s.NightlyRate, p =>
        {
            p.Property(m => m.Amount).HasColumnName("nightly_rate").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });

        builder.OwnsOne(s => s.Subtotal, p =>
        {
            p.Property(m => m.Amount).HasColumnName("subtotal").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });
    }
}

public class ReservationHoldConfiguration : IEntityTypeConfiguration<ReservationHold>
{
    public void Configure(EntityTypeBuilder<ReservationHold> builder)
    {
        builder.ToTable("reservation_hold");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).UseIdentityAlwaysColumn();

        builder.Property(h => h.ResourceType).HasMaxLength(50).IsRequired();
        builder.Property(h => h.State).HasMaxLength(50).IsRequired();
        builder.Property(h => h.RowVersion).IsConcurrencyToken();
        builder.HasIndex(h => new { h.ResourceType, h.ResourceId, h.State });
    }
}
