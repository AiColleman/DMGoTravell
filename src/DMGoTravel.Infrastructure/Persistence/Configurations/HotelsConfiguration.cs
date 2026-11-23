using DMGoTravel.Domain.Modules.Hotels;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DMGoTravel.Infrastructure.Persistence.Configurations;

public class HotelConfiguration : IEntityTypeConfiguration<Hotel>
{
    public void Configure(EntityTypeBuilder<Hotel> builder)
    {
        builder.ToTable("hotel");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).UseIdentityAlwaysColumn();
        builder.HasIndex(h => h.PublicId).IsUnique();

        builder.Property(h => h.Name).HasMaxLength(200).IsRequired();
        builder.Property(h => h.NormalizedKey).HasMaxLength(200).IsRequired();
        builder.Property(h => h.Description).IsRequired();

        builder.HasMany(h => h.Services)
            .WithOne()
            .HasForeignKey(s => s.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(h => h.RoomTypes)
            .WithOne()
            .HasForeignKey(r => r.HotelId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class HotelServiceConfiguration : IEntityTypeConfiguration<HotelService>
{
    public void Configure(EntityTypeBuilder<HotelService> builder)
    {
        builder.ToTable("hotel_service");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).UseIdentityAlwaysColumn();
        builder.Property(s => s.Text).HasMaxLength(150).IsRequired();
    }
}

public class RoomTypeConfiguration : IEntityTypeConfiguration<RoomType>
{
    public void Configure(EntityTypeBuilder<RoomType> builder)
    {
        builder.ToTable("room_type");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).UseIdentityAlwaysColumn();
        builder.HasIndex(r => r.PublicId).IsUnique();

        builder.Property(r => r.Name).HasMaxLength(150).IsRequired();
        builder.Property(r => r.NormalizedKey).HasMaxLength(150).IsRequired();

        builder.OwnsOne(r => r.BaseRate, p =>
        {
            p.Property(m => m.Amount).HasColumnName("base_rate").HasPrecision(14, 2).IsRequired();
            p.Ignore(m => m.Currency);
        });
    }
}

public class RoomInventoryNightConfiguration : IEntityTypeConfiguration<RoomInventoryNight>
{
    public void Configure(EntityTypeBuilder<RoomInventoryNight> builder)
    {
        builder.ToTable("room_inventory_night");

        builder.HasKey(r => new { r.RoomTypeId, r.StayDate });
    }
}

public class LodgingProposalConfiguration : IEntityTypeConfiguration<LodgingProposal>
{
    public void Configure(EntityTypeBuilder<LodgingProposal> builder)
    {
        builder.ToTable("lodging_proposal");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).UseIdentityAlwaysColumn();
        builder.HasIndex(p => p.PublicId).IsUnique();
    }
}
