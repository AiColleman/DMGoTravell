using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Hotels;
using DMGoTravel.Domain.Modules.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Infrastructure.Persistence;

/// <summary>
/// Siembra datos base de desarrollo e incorpora de forma idempotente el catálogo real completo de
/// los 9 hoteles aliados de DM GO TRAVEL en Ayacucho (Spec 007) y sus 53 tipos de habitación con
/// activos multimedia ficticios listos para reemplazarse por fotografías originales mediante administración.
/// </summary>
public static class DevelopmentDataSeeder
{
    public const string DemoEmail = "cliente@example.test";
    public const string DemoAdminEmail = "admin@dmgotravel.com";
    public const string DemoAdminPassword = "Admin-DMGo-2026!";
    public const string DemoPassword = "Clave-ficticia-123";

    private static readonly byte[] MinimalValidJpegBytes =
        [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9];

    private static readonly HashSet<string> LegacyDemoHotelNormalizedKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "HOTEL DE EJEMPLO",
        "CASA DEL VALLE & PATIO INCA",
        "CASA DEL VALLE & PATIO INCA (CUSCO)",
        "CASONA SANTA ROSA DE HUAMANGA",
        "HOTEL BOUTIQUE DEL VALLE"
    };

    private sealed record SeedImageDef(
        string FileName,
        string AssetPublicId,
        string Role,
        int Position);

    private sealed record SeedRoomDef(
        string PublicId,
        string Name,
        int Capacity,
        decimal BasePrice,
        string FictivePhotoFile,
        string PhotoAssetPublicId);

    private sealed record SeedHotelDef(
        string PublicId,
        string Name,
        string Description,
        SeedImageDef[] HotelImages,
        string[] Services,
        SeedRoomDef[] Rooms);

    private static readonly SeedHotelDef[] OfficialDmGoTravelHotels =
    [
        new(
            PublicId: "00000000-0000-4000-8007-000000000101",
            Name: "Hotel Internazionale (Hotel - Restaurant)",
            Description: "Categoría: 3 estrellas · Hotel - Restaurant. Ubicación: A 10 minutos de la Plaza Mayor de Ayacucho — Jr. José Olaya N° 588, Emadi. Horarios: Check-in 1:00 pm | Check-out 12:00 pm.",
            HotelImages:
            [
                new("hotel-internazionale.jpg", "00000000-0000-4000-8710-000000000101", "main", 1),
                new("room-queen-king.jpg", "00000000-0000-4000-8711-000000000101", "gallery", 2),
                new("room-doble.jpg", "00000000-0000-4000-8712-000000000101", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000101", "gallery", 4)
            ],
            Services:
            [
                "Desayuno Buffet (7:00 am - 9:00 am)",
                "Bebidas calientes en el primer nivel",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 50\"",
                "Escritorio y ropero",
                "Cochera",
                "Cafetería y restaurante",
                "Ascensor"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8701-000000000001", "Hab. Individual", 1, 100.00m, "room-individual.jpg", "00000000-0000-4000-8721-000000000001"),
                new("00000000-0000-4000-8701-000000000002", "Hab. Matrimonial", 2, 110.00m, "room-matrimonial.jpg", "00000000-0000-4000-8721-000000000002"),
                new("00000000-0000-4000-8701-000000000003", "Hab. Matrimonial Queen", 2, 130.00m, "room-queen-king.jpg", "00000000-0000-4000-8721-000000000003"),
                new("00000000-0000-4000-8701-000000000004", "Hab. Doble (2 pers.)", 2, 140.00m, "room-doble.jpg", "00000000-0000-4000-8721-000000000004"),
                new("00000000-0000-4000-8701-000000000005", "Hab. Triple", 3, 150.00m, "room-triple.jpg", "00000000-0000-4000-8721-000000000005"),
                new("00000000-0000-4000-8701-000000000006", "Hab. Triple (4 pers.)", 4, 190.00m, "room-familiar.jpg", "00000000-0000-4000-8721-000000000006"),
                new("00000000-0000-4000-8701-000000000007", "Hab. Doble (3 pers.)", 3, 200.00m, "room-triple.jpg", "00000000-0000-4000-8721-000000000007"),
                new("00000000-0000-4000-8701-000000000008", "Hab. Doble (4 pers.)", 4, 240.00m, "room-familiar.jpg", "00000000-0000-4000-8721-000000000008")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000102",
            Name: "Hotel Sumaq Plaza",
            Description: "Ambiente eco-amigable y decoración típica de la zona. Ubicación: A pocos pasos de la Plaza Mayor de Ayacucho. Horarios: Check-in 11:00 am | Check-out 11:00 am.",
            HotelImages:
            [
                new("hotel-sumaq-plaza.jpg", "00000000-0000-4000-8710-000000000102", "main", 1),
                new("room-queen-king.jpg", "00000000-0000-4000-8711-000000000102", "gallery", 2),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8712-000000000102", "gallery", 3),
                new("room-familiar.jpg", "00000000-0000-4000-8713-000000000102", "gallery", 4)
            ],
            Services:
            [
                "Desayuno a la carta (7:00 am - 9:00 am)",
                "Bebidas calientes",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 50\"",
                "Escritorio y ropero",
                "Friobar y microondas",
                "Hotel Pet Friendly"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8702-000000000001", "Hab. Individual", 1, 100.00m, "room-individual.jpg", "00000000-0000-4000-8722-000000000001"),
                new("00000000-0000-4000-8702-000000000002", "Hab. Matrimonial", 2, 120.00m, "room-matrimonial.jpg", "00000000-0000-4000-8722-000000000002"),
                new("00000000-0000-4000-8702-000000000003", "Hab. Matrimonial King", 2, 140.00m, "room-queen-king.jpg", "00000000-0000-4000-8722-000000000003"),
                new("00000000-0000-4000-8702-000000000004", "Hab. Doble (2 pers.)", 2, 140.00m, "room-doble.jpg", "00000000-0000-4000-8722-000000000004"),
                new("00000000-0000-4000-8702-000000000005", "Hab. Doble (3 pers.)", 3, 160.00m, "room-triple.jpg", "00000000-0000-4000-8722-000000000005"),
                new("00000000-0000-4000-8702-000000000006", "Hab. Doble (4 pers.)", 4, 180.00m, "room-familiar.jpg", "00000000-0000-4000-8722-000000000006"),
                new("00000000-0000-4000-8702-000000000007", "Hab. Triple (4 pers.)", 4, 200.00m, "room-familiar.jpg", "00000000-0000-4000-8722-000000000007")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000103",
            Name: "Hotel Rivera",
            Description: "Categoría: 2 estrellas. Ubicación: A 2 cuadras de la Plaza Mayor de Ayacucho — Jr. Callao N° 316, Ayacucho. Horarios: Check-in 12:00 pm | Check-out 12:00 pm.",
            HotelImages:
            [
                new("hotel-rivera.jpg", "00000000-0000-4000-8710-000000000103", "main", 1),
                new("room-doble.jpg", "00000000-0000-4000-8711-000000000103", "gallery", 2),
                new("room-familiar.jpg", "00000000-0000-4000-8712-000000000103", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000103", "gallery", 4)
            ],
            Services:
            [
                "Desayuno americano - continental (7:00 am - 9:00 am)",
                "Bebidas calientes en el primer nivel",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 50\"",
                "Escritorio y ropero"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8703-000000000001", "Hab. Individual", 1, 130.00m, "room-individual.jpg", "00000000-0000-4000-8723-000000000001"),
                new("00000000-0000-4000-8703-000000000002", "Hab. Matrimonial", 2, 160.00m, "room-matrimonial.jpg", "00000000-0000-4000-8723-000000000002"),
                new("00000000-0000-4000-8703-000000000003", "Hab. Doble (2 pers.)", 2, 180.00m, "room-doble.jpg", "00000000-0000-4000-8723-000000000003"),
                new("00000000-0000-4000-8703-000000000004", "Hab. Doble (3 pers.)", 3, 200.00m, "room-triple.jpg", "00000000-0000-4000-8723-000000000004"),
                new("00000000-0000-4000-8703-000000000005", "Hab. Doble (4 pers.)", 4, 220.00m, "room-familiar.jpg", "00000000-0000-4000-8723-000000000005"),
                new("00000000-0000-4000-8703-000000000006", "Hab. Triple", 3, 220.00m, "room-triple.jpg", "00000000-0000-4000-8723-000000000006"),
                new("00000000-0000-4000-8703-000000000007", "Hab. Triple (4 pers.)", 4, 240.00m, "room-familiar.jpg", "00000000-0000-4000-8723-000000000007")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000104",
            Name: "Hotel Condeduque",
            Description: "Combina lo colonial en sus instalaciones. Ubicación: A media cuadra de la Plaza Mayor de Ayacucho — Jr. Asamblea N° 159. Horarios: Check-in 12:00 pm | Check-out 12:00 pm.",
            HotelImages:
            [
                new("hotel-condeduque.jpg", "00000000-0000-4000-8710-000000000104", "main", 1),
                new("room-matrimonial.jpg", "00000000-0000-4000-8711-000000000104", "gallery", 2),
                new("room-triple.jpg", "00000000-0000-4000-8712-000000000104", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000104", "gallery", 4)
            ],
            Services:
            [
                "Desayuno americano - continental (7:00 am - 9:00 am)",
                "Bebidas calientes en el primer nivel",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 45\"",
                "Escritorio y ropero"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8704-000000000001", "Hab. Individual", 1, 110.00m, "room-individual.jpg", "00000000-0000-4000-8724-000000000001"),
                new("00000000-0000-4000-8704-000000000002", "Hab. Matrimonial", 2, 160.00m, "room-matrimonial.jpg", "00000000-0000-4000-8724-000000000002"),
                new("00000000-0000-4000-8704-000000000003", "Hab. Doble (2 pers.)", 2, 160.00m, "room-doble.jpg", "00000000-0000-4000-8724-000000000003"),
                new("00000000-0000-4000-8704-000000000004", "Hab. Doble (3 pers.)", 3, 210.00m, "room-triple.jpg", "00000000-0000-4000-8724-000000000004"),
                new("00000000-0000-4000-8704-000000000005", "Hab. Doble (4 pers.)", 4, 230.00m, "room-familiar.jpg", "00000000-0000-4000-8724-000000000005")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000105",
            Name: "Hotel Samary (Hotel & Apartment)",
            Description: "Combina lo moderno en sus instalaciones (Hotel & Apartment). Ubicación: A 2 cuadras de la Plaza Mayor de Ayacucho — Jr. Callao N° 335. Horarios: Check-in 12:00 pm | Check-out 11:00 am.",
            HotelImages:
            [
                new("hotel-samary.jpg", "00000000-0000-4000-8710-000000000105", "main", 1),
                new("room-matrimonial.jpg", "00000000-0000-4000-8711-000000000105", "gallery", 2),
                new("room-doble.jpg", "00000000-0000-4000-8712-000000000105", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000105", "gallery", 4)
            ],
            Services:
            [
                "Desayuno servido en el Hotel Sumaq Plaza (7:00 am - 9:00 am)",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 50\" con Disney+",
                "Escritorio y ropero",
                "Cochera"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8705-000000000001", "Hab. Individual", 1, 80.00m, "room-individual.jpg", "00000000-0000-4000-8725-000000000001"),
                new("00000000-0000-4000-8705-000000000002", "Hab. Matrimonial", 2, 100.00m, "room-matrimonial.jpg", "00000000-0000-4000-8725-000000000002"),
                new("00000000-0000-4000-8705-000000000003", "Hab. Doble (2 pers.)", 2, 110.00m, "room-doble.jpg", "00000000-0000-4000-8725-000000000003"),
                new("00000000-0000-4000-8705-000000000004", "Hab. Doble (3 pers.)", 3, 140.00m, "room-triple.jpg", "00000000-0000-4000-8725-000000000004")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000106",
            Name: "Hotel Continental",
            Description: "Categoría: 2 estrellas · Combina lo moderno en sus instalaciones. Ubicación: A 3 cuadras de la Plaza Mayor de Ayacucho — Jr. Carlos F. Vivanco N° 475. Horarios: Check-in 12:00 pm | Check-out 11:00 am.",
            HotelImages:
            [
                new("hotel-continental.jpg", "00000000-0000-4000-8710-000000000106", "main", 1),
                new("room-queen-king.jpg", "00000000-0000-4000-8711-000000000106", "gallery", 2),
                new("room-doble.jpg", "00000000-0000-4000-8712-000000000106", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000106", "gallery", 4)
            ],
            Services:
            [
                "Desayuno atendido en el Hotel Sumaq Plaza (7:00 am - 9:00 am)",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 45\"",
                "Escritorio y ropero",
                "Cafetería",
                "Ascensor"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8706-000000000001", "Hab. Matrimonial", 2, 80.00m, "room-matrimonial.jpg", "00000000-0000-4000-8726-000000000001"),
                new("00000000-0000-4000-8706-000000000002", "Hab. Matrimonial Queen", 2, 90.00m, "room-queen-king.jpg", "00000000-0000-4000-8726-000000000002"),
                new("00000000-0000-4000-8706-000000000003", "Hab. Doble (2 pers.)", 2, 110.00m, "room-doble.jpg", "00000000-0000-4000-8726-000000000003"),
                new("00000000-0000-4000-8706-000000000004", "Hab. Doble (3 pers.)", 3, 130.00m, "room-triple.jpg", "00000000-0000-4000-8726-000000000004"),
                new("00000000-0000-4000-8706-000000000005", "Hab. Triple (3 pers.)", 3, 140.00m, "room-triple.jpg", "00000000-0000-4000-8726-000000000005"),
                new("00000000-0000-4000-8706-000000000006", "Hab. Doble (4 pers.)", 4, 150.00m, "room-familiar.jpg", "00000000-0000-4000-8726-000000000006")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000107",
            Name: "Hotel El Libertador",
            Description: "Combina lo colonial en sus instalaciones. Ubicación: A 3 cuadras de la Plaza Mayor de Ayacucho — Jr. San Martín N° 324. Horarios: Check-in 12:00 pm | Check-out 11:00 am.",
            HotelImages:
            [
                new("hotel-el-libertador.jpg", "00000000-0000-4000-8710-000000000107", "main", 1),
                new("room-individual.jpg", "00000000-0000-4000-8711-000000000107", "gallery", 2),
                new("room-matrimonial.jpg", "00000000-0000-4000-8712-000000000107", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000107", "gallery", 4)
            ],
            Services:
            [
                "Desayuno atendido en el Hotel Sumaq Plaza (7:00 am - 9:00 am)",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 45\"",
                "Escritorio y ropero"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8707-000000000001", "Hab. Individual", 1, 80.00m, "room-individual.jpg", "00000000-0000-4000-8727-000000000001"),
                new("00000000-0000-4000-8707-000000000002", "Hab. Matrimonial", 2, 100.00m, "room-matrimonial.jpg", "00000000-0000-4000-8727-000000000002"),
                new("00000000-0000-4000-8707-000000000003", "Hab. Doble (2 pers.)", 2, 120.00m, "room-doble.jpg", "00000000-0000-4000-8727-000000000003"),
                new("00000000-0000-4000-8707-000000000004", "Hab. Doble (3 pers.)", 3, 130.00m, "room-triple.jpg", "00000000-0000-4000-8727-000000000004"),
                new("00000000-0000-4000-8707-000000000005", "Hab. Doble (4 pers.)", 4, 140.00m, "room-familiar.jpg", "00000000-0000-4000-8727-000000000005")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000108",
            Name: "Hotel Casa Rústica",
            Description: "Combina lo colonial en sus instalaciones. Ubicación: A 3 cuadras de la Plaza Mayor de Ayacucho — Jr. San Martín N° 324. Horarios: Check-in 1:00 pm | Check-out 11:00 am.",
            HotelImages:
            [
                new("hotel-casa-rustica.jpg", "00000000-0000-4000-8710-000000000108", "main", 1),
                new("room-matrimonial.jpg", "00000000-0000-4000-8711-000000000108", "gallery", 2),
                new("room-triple.jpg", "00000000-0000-4000-8712-000000000108", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000108", "gallery", 4)
            ],
            Services:
            [
                "Desayuno americano - continental (7:00 am - 9:00 am)",
                "Bebidas calientes en el primer nivel",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 45\"",
                "Escritorio y ropero"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8708-000000000001", "Hab. Individual Sup.", 1, 80.00m, "room-individual.jpg", "00000000-0000-4000-8728-000000000001"),
                new("00000000-0000-4000-8708-000000000002", "Hab. Matrimonial", 2, 100.00m, "room-matrimonial.jpg", "00000000-0000-4000-8728-000000000002"),
                new("00000000-0000-4000-8708-000000000003", "Hab. Doble (2 pers.)", 2, 130.00m, "room-doble.jpg", "00000000-0000-4000-8728-000000000003"),
                new("00000000-0000-4000-8708-000000000004", "Hab. Doble (3 pers.)", 3, 150.00m, "room-triple.jpg", "00000000-0000-4000-8728-000000000004"),
                new("00000000-0000-4000-8708-000000000005", "Hab. Triple (3 pers.)", 3, 150.00m, "room-triple.jpg", "00000000-0000-4000-8728-000000000005"),
                new("00000000-0000-4000-8708-000000000006", "Hab. Triple (4 pers.)", 4, 160.00m, "room-familiar.jpg", "00000000-0000-4000-8728-000000000006")
            ]),

        new(
            PublicId: "00000000-0000-4000-8007-000000000109",
            Name: "Hospedaje Santa Lucía",
            Description: "Categoría: Hostal 2 estrellas · Combina lo colonial en sus instalaciones. Ubicación: A 4 cuadras de la Plaza Mayor — Jr. Sol N° 140, Huamanga. Horarios: Check-in 1:00 pm | Check-out 11:00 am.",
            HotelImages:
            [
                new("hospedaje-santa-lucia.jpg", "00000000-0000-4000-8710-000000000109", "main", 1),
                new("room-doble.jpg", "00000000-0000-4000-8711-000000000109", "gallery", 2),
                new("room-familiar.jpg", "00000000-0000-4000-8712-000000000109", "gallery", 3),
                new("hotel-desayuno.jpg", "00000000-0000-4000-8713-000000000109", "gallery", 4)
            ],
            Services:
            [
                "Desayuno americano - continental (7:00 am - 9:00 am)",
                "Wifi fibra óptica",
                "Baño privado y agua caliente",
                "TV Smart 45\"",
                "Escritorio y ropero"
            ],
            Rooms:
            [
                new("00000000-0000-4000-8709-000000000001", "Hab. Individual", 1, 80.00m, "room-individual.jpg", "00000000-0000-4000-8729-000000000001"),
                new("00000000-0000-4000-8709-000000000002", "Hab. Matrimonial", 2, 110.00m, "room-matrimonial.jpg", "00000000-0000-4000-8729-000000000002"),
                new("00000000-0000-4000-8709-000000000003", "Hab. Doble (2 pers.)", 2, 130.00m, "room-doble.jpg", "00000000-0000-4000-8729-000000000003"),
                new("00000000-0000-4000-8709-000000000004", "Hab. Doble (3 pers.)", 3, 140.00m, "room-triple.jpg", "00000000-0000-4000-8729-000000000004"),
                new("00000000-0000-4000-8709-000000000005", "Hab. Triple (4 pers.)", 4, 160.00m, "room-familiar.jpg", "00000000-0000-4000-8729-000000000005")
            ])
    ];

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        var clock = services.GetRequiredService<IDateTimeProvider>();
        var mediaStorage = services.GetService<IMediaStorage>();

        // Garantiza siempre una cuenta administrativa ficticia en Development para pruebas locales,
        // incluso cuando la base de desarrollo ya fue inicializada previamente.
        var normalizedAdminEmail = DemoAdminEmail.ToUpperInvariant();
        if (!await db.Users.AnyAsync(u => u.NormalizedEmail == normalizedAdminEmail, cancellationToken))
        {
            var admin = User.CreateAdmin(
                DemoAdminEmail,
                passwordHasher.Hash(DemoAdminPassword),
                "Administrador DMGOTRAVEL");
            db.Users.Add(admin);
            await db.SaveChangesAsync(cancellationToken);
        }

        var now = clock.UtcNow;

        if (!await db.Users.AnyAsync(u => u.Role == UserRole.Client, cancellationToken) &&
            !await db.Offers.AnyAsync(cancellationToken))
        {
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

        await SeedOfficialHotelsCatalogAsync(db, mediaStorage, clock, now, cancellationToken);
    }

    private static async Task SeedOfficialHotelsCatalogAsync(
        ApplicationDbContext db,
        IMediaStorage? mediaStorage,
        IDateTimeProvider clock,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        // 1. Si existen hoteles ficticios heredados en una base de desarrollo previa, desactivarlos
        var activeLegacyHotels = await db.Hotels
            .Where(h => h.IsActive && h.DeletedAtUtc == null && LegacyDemoHotelNormalizedKeys.Contains(h.NormalizedKey))
            .ToListAsync(cancellationToken);

        foreach (var legacy in activeLegacyHotels)
        {
            legacy.Deactivate(nowUtc);
        }

        if (activeLegacyHotels.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        // 2. Crear de forma idempotente cualquiera de los 9 hoteles oficiales de DM GO TRAVEL que falte
        var existingKeys = await db.Hotels
            .AsNoTracking()
            .Where(h => h.DeletedAtUtc == null)
            .Select(h => h.NormalizedKey)
            .ToHashSetAsync(cancellationToken);

        var existingPublicIds = await db.Hotels
            .AsNoTracking()
            .Select(h => h.PublicId)
            .ToHashSetAsync(cancellationToken);

        var newlyCreatedHotelGuids = new HashSet<Guid>();

        foreach (var def in OfficialDmGoTravelHotels)
        {
            var hotelGuid = Guid.Parse(def.PublicId);
            var normalized = def.Name.Trim().ToUpperInvariant();
            if (existingPublicIds.Contains(hotelGuid) || existingKeys.Contains(normalized))
            {
                continue;
            }

            var hotel = Hotel.Create(def.Name, def.Description, hotelGuid);
            foreach (var srv in def.Services)
            {
                hotel.AddService(srv);
            }

            foreach (var rm in def.Rooms)
            {
                hotel.AddRoomType(new RoomType(0, rm.Name, rm.Capacity, Money.Create(rm.BasePrice), Guid.Parse(rm.PublicId)));
            }

            hotel.Activate(hasImage: true, nowUtc);
            db.Hotels.Add(hotel);
            newlyCreatedHotelGuids.Add(hotelGuid);
        }

        if (newlyCreatedHotelGuids.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        // 3. Sincronizar de forma idempotente las 4 imágenes de galería por hotel y las 53 fotos ficticias de habitación
        var officialHotelGuids = OfficialDmGoTravelHotels.Select(d => Guid.Parse(d.PublicId)).ToList();
        var officialHotelEntities = await db.Hotels
            .Include(h => h.RoomTypes)
            .Where(h => officialHotelGuids.Contains(h.PublicId) && h.DeletedAtUtc == null)
            .ToDictionaryAsync(h => h.PublicId, cancellationToken);

        var existingMediaPublicIds = await db.MediaAssets
            .AsNoTracking()
            .Select(m => m.PublicId)
            .ToHashSetAsync(cancellationToken);

        var assetsFolder = LocateFrontendHotelsAssetsDir();
        var photoBytesCache = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);

        byte[] LoadPhotoBytes(string fileName)
        {
            if (photoBytesCache.TryGetValue(fileName, out var cached))
            {
                return cached;
            }

            if (assetsFolder is not null)
            {
                var candidate = Path.Combine(assetsFolder, fileName);
                if (File.Exists(candidate))
                {
                    var fileBytes = File.ReadAllBytes(candidate);
                    if (fileBytes.Length > 0 && fileBytes.Length <= MediaAsset.MaxImageSizeBytes)
                    {
                        photoBytesCache[fileName] = fileBytes;
                        return fileBytes;
                    }
                }
            }

            photoBytesCache[fileName] = MinimalValidJpegBytes;
            return MinimalValidJpegBytes;
        }

        var todayPeru = clock.TodayInPeru;
        var activeTourDepartures = newlyCreatedHotelGuids.Count > 0
            ? await db.TourDepartures
                .AsNoTracking()
                .Join(
                    db.Offers.AsNoTracking().Where(o => o.IsActive && o.DeletedAtUtc == null && o.Type == OfferType.Tour),
                    d => d.OfferId,
                    o => o.Id,
                    (d, _) => d)
                .Where(d => d.IsActive && d.DeletedAtUtc == null && d.StartsAtUtc > nowUtc)
                .ToListAsync(cancellationToken)
            : [];

        var hasCatalogAdditions = false;

        foreach (var def in OfficialDmGoTravelHotels)
        {
            var hotelGuid = Guid.Parse(def.PublicId);
            if (!officialHotelEntities.TryGetValue(hotelGuid, out var hotel))
            {
                continue;
            }

            var isNewlyCreated = newlyCreatedHotelGuids.Contains(hotelGuid);

            foreach (var imgDef in def.HotelImages)
            {
                var assetGuid = Guid.Parse(imgDef.AssetPublicId);
                if (!existingMediaPublicIds.Contains(assetGuid))
                {
                    var bytes = LoadPhotoBytes(imgDef.FileName);
                    var key = $"hotels/{hotel.PublicId:N}/seed-{imgDef.Position}-{imgDef.FileName}";
                    if (mediaStorage is not null)
                    {
                        await mediaStorage.SaveAsync(key, bytes, "image/jpeg", cancellationToken);
                    }

                    db.MediaAssets.Add(MediaAsset.CreateForHotel(
                        key,
                        $"/api/v1/media/{assetGuid}",
                        "image/jpeg",
                        bytes.Length,
                        imgDef.Role,
                        imgDef.Position,
                        hotel.Id,
                        isPublished: true,
                        publicId: assetGuid));

                    existingMediaPublicIds.Add(assetGuid);
                    hasCatalogAdditions = true;
                }
            }

            var roomEntitiesByPublicId = hotel.RoomTypes.ToDictionary(r => r.PublicId);
            foreach (var rmDef in def.Rooms)
            {
                var rmGuid = Guid.Parse(rmDef.PublicId);
                if (!roomEntitiesByPublicId.TryGetValue(rmGuid, out var rmEntity))
                {
                    continue;
                }

                var rmAssetGuid = Guid.Parse(rmDef.PhotoAssetPublicId);
                if (!existingMediaPublicIds.Contains(rmAssetGuid))
                {
                    var rmBytes = LoadPhotoBytes(rmDef.FictivePhotoFile);
                    var rmKey = $"hotels/{hotel.PublicId:N}/room-types/{rmEntity.PublicId:N}/seed-{rmDef.FictivePhotoFile}";
                    if (mediaStorage is not null)
                    {
                        await mediaStorage.SaveAsync(rmKey, rmBytes, "image/jpeg", cancellationToken);
                    }

                    db.MediaAssets.Add(MediaAsset.CreateForRoomType(
                        rmKey,
                        $"/api/v1/media/{rmAssetGuid}",
                        "image/jpeg",
                        rmBytes.Length,
                        "main",
                        1,
                        hotel.Id,
                        rmEntity.Id,
                        isPublished: true,
                        publicId: rmAssetGuid));

                    existingMediaPublicIds.Add(rmAssetGuid);
                    hasCatalogAdditions = true;
                }

                if (isNewlyCreated)
                {
                    for (var dayOffset = 1; dayOffset <= 45; dayOffset++)
                    {
                        db.RoomInventoryNights.Add(
                            new RoomInventoryNight(rmEntity.Id, todayPeru.AddDays(dayOffset), quantityTotal: 5));
                    }

                    hasCatalogAdditions = true;
                }
            }

            if (isNewlyCreated)
            {
                foreach (var dep in activeTourDepartures)
                {
                    var checkIn = DateOnly.FromDateTime(dep.StartsAtUtc);
                    if (checkIn < todayPeru)
                    {
                        continue;
                    }

                    db.LodgingProposals.Add(new LodgingProposal(
                        dep.Id,
                        hotel.Id,
                        checkIn,
                        checkIn.AddDays(1)));
                    hasCatalogAdditions = true;
                }
            }
        }

        if (hasCatalogAdditions)
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static string? LocateFrontendHotelsAssetsDir()
    {
        var roots = new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory };
        foreach (var start in roots)
        {
            var dir = new DirectoryInfo(start);
            for (var depth = 0; depth < 7 && dir is not null; depth++, dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, "frontend-peru-premium", "public", "assets", "hotels");
                if (Directory.Exists(candidate))
                {
                    return candidate;
                }
            }
        }

        return null;
    }
}
