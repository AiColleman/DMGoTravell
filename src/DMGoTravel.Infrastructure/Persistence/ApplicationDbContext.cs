using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Exports;
using DMGoTravel.Domain.Modules.Hotels;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using DMGoTravel.Infrastructure.Persistence.Idempotency;
using Microsoft.EntityFrameworkCore;

namespace DMGoTravel.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IUnitOfWork
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Identity
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Catalog
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<TourDeparture> TourDepartures => Set<TourDeparture>();
    public DbSet<OfferItineraryDay> OfferItineraryDays => Set<OfferItineraryDay>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();

    // Hotels
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<HotelService> HotelServices => Set<HotelService>();
    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<RoomInventoryNight> RoomInventoryNights => Set<RoomInventoryNight>();
    public DbSet<LodgingProposal> LodgingProposals => Set<LodgingProposal>();

    // Reservations
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<ReservationOfferSnapshot> ReservationOfferSnapshots => Set<ReservationOfferSnapshot>();
    public DbSet<ReservationLodgingSnapshot> ReservationLodgingSnapshots => Set<ReservationLodgingSnapshot>();
    public DbSet<ReservationHold> ReservationHolds => Set<ReservationHold>();

    // Payments
    public DbSet<PaymentAttempt> PaymentAttempts => Set<PaymentAttempt>();
    public DbSet<ExternalPayment> ExternalPayments => Set<ExternalPayment>();

    // Idempotency
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    // Audit
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // Exports
    public DbSet<ExportJob> ExportJobs => Set<ExportJob>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica todas las configuraciones fluidas de entidades conforme a MD-01
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictAppException();
        }
    }
}
