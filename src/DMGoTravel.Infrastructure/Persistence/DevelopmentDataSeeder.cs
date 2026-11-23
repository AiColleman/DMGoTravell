using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Infrastructure.Persistence;

/// <summary>
/// Datos ficticios mínimos para probar la primera vertical slice en Development.
/// No crea cuentas reales, no envía correos y no representa catálogo comercial.
/// </summary>
public static class DevelopmentDataSeeder
{
    public const string DemoEmail = "cliente@example.test";
    public const string DemoPassword = "Clave-ficticia-123";

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        var clock = services.GetRequiredService<IDateTimeProvider>();

        if (await db.Users.AnyAsync(cancellationToken) || await db.Offers.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = clock.UtcNow;

        var user = User.CreateClient(
            DemoEmail,
            passwordHasher.Hash(DemoPassword),
            "Cliente Ficticio",
            "+51999999999");
        user.VerifyEmail();
        db.Users.Add(user);

        var tour = Offer.Create(
            OfferType.Tour,
            "Tour de ejemplo",
            "Tour ficticio de un día para validar la primera vertical slice.",
            1,
            DurationUnit.Days,
            Money.Create(120m),
            "Sujeto a disponibilidad.\nNo incluye gastos personales.");

        tour.AddItineraryDay(new OfferItineraryDay(
            1,
            "Día completo",
            "Visita guiada ficticia y retorno el mismo día."));

        tour.AddDeparture(new TourDeparture(
            0,
            now.AddDays(30),
            now.AddDays(30).AddHours(10),
            20,
            Money.Create(120m)));

        tour.AddImage(MediaAsset.CreateForOffer(
            "dev/tour-ejemplo.jpg",
            "https://media.example.test/tour-ejemplo.jpg",
            "image/jpeg",
            1024,
            "main",
            0,
            0));

        tour.Activate();

        var package = Offer.Create(
            OfferType.Package,
            "Paquete de ejemplo",
            "Paquete ficticio de dos días para validar listado y detalle.",
            2,
            DurationUnit.Days,
            Money.Create(250m),
            "Sujeto a disponibilidad.\nIncluye alojamiento ficticio.");

        package.AddItineraryDay(new OfferItineraryDay(
            1,
            "Llegada",
            "Traslado ficticio y check-in."));
        package.AddItineraryDay(new OfferItineraryDay(
            2,
            "Salida",
            "Desayuno ficticio y retorno."));

        package.AddDeparture(new TourDeparture(
            0,
            now.AddDays(45),
            now.AddDays(47),
            10,
            Money.Create(250m)));

        package.AddImage(MediaAsset.CreateForOffer(
            "dev/paquete-ejemplo.jpg",
            "https://media.example.test/paquete-ejemplo.jpg",
            "image/jpeg",
            1024,
            "main",
            0,
            0));

        package.Activate();

        db.Offers.AddRange(tour, package);
        await db.SaveChangesAsync(cancellationToken);
    }
}
