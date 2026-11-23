using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> builder)
    {
        builder.ToTable("offer");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).UseIdentityAlwaysColumn();

        builder.HasIndex(o => o.PublicId).IsUnique();
        builder.HasIndex(o => new { o.Type, o.NormalizedKey });

        builder.Property(o => o.Name).HasMaxLength(200).IsRequired();
        builder.Property(o => o.NormalizedKey).HasMaxLength(200).IsRequired();
        builder.Property(o => o.Description).IsRequired();
        builder.Property(o => o.Conditions).IsRequired();
        builder.Property(o => o.RowVersion).IsConcurrencyToken();

        // Conversión de Value Object Money a columnas de base de datos
        builder.OwnsOne(o => o.PriceNormal, p =>
        {
            p.Property(m => m.Amount).HasColumnName("price_normal").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });

        builder.OwnsOne(o => o.PriceDiscounted, p =>
        {
            p.Property(m => m.Amount).HasColumnName("price_discounted").HasPrecision(14, 2);
            p.Ignore(m => m.Currency);
        });

        builder.HasMany(o => o.Itinerary)
            .WithOne()
            .HasForeignKey(i => i.OfferId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Departures)
            .WithOne()
            .HasForeignKey(d => d.OfferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Images)
            .WithOne()
            .HasForeignKey(i => i.OfferId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TourDepartureConfiguration : IEntityTypeConfiguration<TourDeparture>
{
    public void Configure(EntityTypeBuilder<TourDeparture> builder)
    {
        builder.ToTable("offer_departure");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).UseIdentityAlwaysColumn();
        builder.HasIndex(d => d.PublicId).IsUnique();
        builder.HasIndex(d => new { d.OfferId, d.StartsAtUtc });
        builder.Property(d => d.RowVersion).IsConcurrencyToken();

        builder.OwnsOne(d => d.PriceNormal, p =>
        {
            p.Property(m => m.Amount).HasColumnName("price_normal").HasPrecision(14, 2);
            p.Ignore(m => m.Currency);
        });

        builder.OwnsOne(d => d.PriceDiscounted, p =>
        {
            p.Property(m => m.Amount).HasColumnName("price_discounted").HasPrecision(14, 2);
            p.Ignore(m => m.Currency);
        });
    }
}

public class OfferItineraryDayConfiguration : IEntityTypeConfiguration<OfferItineraryDay>
{
    public void Configure(EntityTypeBuilder<OfferItineraryDay> builder)
    {
        builder.ToTable("offer_itinerary_day");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).UseIdentityAlwaysColumn();

        builder.Property(i => i.Title).HasMaxLength(200).IsRequired();
        builder.Property(i => i.Activities).IsRequired();
    }
}

public class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable("media_asset");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).UseIdentityAlwaysColumn();
        builder.HasIndex(m => m.PublicId).IsUnique();

        builder.Property(m => m.ObjectKey).HasMaxLength(500).IsRequired();
        builder.Property(m => m.Url).HasMaxLength(1000).IsRequired();
        builder.Property(m => m.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(m => m.Role).HasMaxLength(50).IsRequired();
        builder.Property(m => m.RowVersion).IsConcurrencyToken();
        builder.HasIndex(m => new { m.OfferId, m.Position });
        builder.HasIndex(m => new { m.HotelId, m.RoomTypeId, m.Position });
        builder.HasIndex(m => m.MobilityItemId);
    }
}
