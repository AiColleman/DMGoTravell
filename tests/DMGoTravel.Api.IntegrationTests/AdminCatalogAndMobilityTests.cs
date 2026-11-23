using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Fase 3 contra PostgreSQL real:
/// - Spec 013 (Movilidad informativa pública/admin, activación con imagen, unicidad activa, orden alfabético y auditoría)
/// - Spec 006 (Catálogo administrativo: alta desactivada, edición, precios, salidas, protección con reservas activas y auditoría)
/// </summary>
[Collection("Integration")]
public sealed class AdminCatalogAndMobilityTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AdminCatalogAndMobilityTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Movilidad 013: alta desactivada, exige imagen para activar, unicidad activa, orden alfabético y auditoría")]
    public async Task Mobility_LifecyclePublicOrderDuplicateAndAudit_ShouldWork()
    {
        var client = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();

        // Cliente no puede crear movilidad (013/RF-13)
        var forbiddenReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/mobility", client.AccessToken);
        forbiddenReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        forbiddenReq.Content = JsonContent.Create(new { name = "Van", description = "AC", type = "van", capacity = 8 }, options: JsonOptions);
        (await Client.SendAsync(forbiddenReq, Ct)).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Admin crea dos categorías (nacen inactivas -> no aparecen en /api/v1/mobility)
        var zId = await CreateMobilityAsync(adminToken, "Zeta Minibús", "Aire acondicionado", "minibus", 15);
        var aId = await CreateMobilityAsync(adminToken, "Alfa Sedán", "Asientos de cuero", "sedan", 4);
        var dupId = await CreateMobilityAsync(adminToken, "  alfa sedán  ", "Otra descripción", "sedan", 4);

        var publicBefore = await Client.GetAsync("/api/v1/mobility", Ct);
        publicBefore.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(publicBefore)).GetProperty("items").GetArrayLength().Should().Be(0);

        // Activar sin imagen falla (013/RF-19)
        var activateNoImage = await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/mobility/{aId}/activate", adminToken);
        activateNoImage.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(activateNoImage)).GetProperty("code").GetString().Should().Be("incomplete_mobility");

        // Asignamos imagen válida a los 3 y activamos Z y A
        await AttachMobilityImageAsync(zId, "https://media.example.test/zeta.jpg");
        await AttachMobilityImageAsync(aId, "https://media.example.test/alfa.jpg");
        await AttachMobilityImageAsync(dupId, "https://media.example.test/dup.jpg");

        (await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/mobility/{zId}/activate", adminToken))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/mobility/{aId}/activate", adminToken))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        // Activar duplicado por nombre normalizado falla (013/RF-24)
        var activateDup = await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/mobility/{dupId}/activate", adminToken);
        activateDup.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(activateDup)).GetProperty("code").GetString().Should().Be("duplicate_active_mobility");

        // Consulta pública devuelve solo activos en orden alfabético (013/RF-11, RF-25)
        var publicAfter = await Client.GetAsync("/api/v1/mobility", Ct);
        publicAfter.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await ReadJsonAsync(publicAfter)).GetProperty("items");
        items.GetArrayLength().Should().Be(2);
        items[0].GetProperty("name").GetString().Should().Be("Alfa Sedán");
        items[1].GetProperty("name").GetString().Should().Be("Zeta Minibús");

        // Desactivar excluye del público y audita (013/RF-10, RF-29)
        (await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/mobility/{zId}/deactivate", adminToken))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var publicAfterDeactivate = await Client.GetAsync("/api/v1/mobility", Ct);
        var remaining = (await ReadJsonAsync(publicAfterDeactivate)).GetProperty("items");
        remaining.GetArrayLength().Should().Be(1);
        remaining[0].GetProperty("name").GetString().Should().Be("Alfa Sedán");

        var audit = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=mobility&entity={zId}",
            adminToken);
        audit.StatusCode.Should().Be(HttpStatusCode.OK);
        var auditJson = await ReadJsonAsync(audit);
        auditJson.GetProperty("total").GetInt32().Should().Be(3); // create, activate, deactivate
    }

    [Fact(DisplayName = "Catálogo Admin 006: crea inactiva, gestiona precios/salidas/itinerario, protege con reservas y audita")]
    public async Task AdminCatalog_CrudPricingDeparturesProtectionAndAudit_ShouldWork()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();

        // Crear oferta nace desactivada (006/RF-13)
        var createReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/catalog/tours", adminToken);
        createReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        createReq.Content = JsonContent.Create(new
        {
            name = "Tour Montaña de Colores",
            description = "Excursión de día completo en Cusco",
            price = "220.00",
            durationDays = 1,
            conditions = new[] { "Salida sujeta a clima" },
            itinerary = new[] { new { day = 1, title = "Ascenso", description = "Caminata guiada" } }
        }, options: JsonOptions);

        var created = await Client.SendAsync(createReq, Ct);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdJson = await ReadJsonAsync(created);
        var offerId = createdJson.GetProperty("id").GetGuid();
        createdJson.GetProperty("status").GetString().Should().Be("inactive");

        // No aparece en catálogo público mientras está inactiva (006/RF-8)
        (await Client.GetAsync($"/api/v1/catalog/tours/{offerId}", Ct))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Activar sin imagen falla (006/RF-15)
        var activateNoImg = await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/catalog/tours/{offerId}/activate", adminToken);
        activateNoImg.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(activateNoImg)).GetProperty("code").GetString().Should().Be("incomplete_offer");

        // Adjuntamos imagen, creamos salida y activamos
        await AttachOfferImageAsync(offerId, "https://media.example.test/vinicunca.jpg");

        var start = DateTime.UtcNow.AddDays(25);
        var end = start.AddHours(10);
        var depReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/catalog/tours/{offerId}/departures", adminToken);
        depReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        depReq.Content = JsonContent.Create(new { startDate = start, endDate = end, price = "220.00", capacity = 12 }, options: JsonOptions);
        var depResp = await Client.SendAsync(depReq, Ct);
        depResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var depId = (await ReadJsonAsync(depResp)).GetProperty("id").GetGuid();

        // Actualizar precio con descuento
        var priceReq = CreateBearerRequest(HttpMethod.Put, $"/api/v1/admin/catalog/tours/{offerId}/pricing", adminToken);
        priceReq.Content = JsonContent.Create(new { normalPrice = "220.00", discountedPrice = "190.00" }, options: JsonOptions);
        (await Client.SendAsync(priceReq, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);

        // Activar oferta -> ahora visible en catálogo público
        var activated = await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/catalog/tours/{offerId}/activate", adminToken);
        activated.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(activated)).GetProperty("status").GetString().Should().Be("active");

        var publicDetail = await Client.GetAsync($"/api/v1/catalog/tours/{offerId}", Ct);
        publicDetail.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(publicDetail)).GetProperty("price").GetString().Should().Be("190.00");

        // Un cliente crea una reserva activa sobre la salida
        var reservation = await CreateReservationAsync(user.AccessToken, depId, travelers: 2);
        reservation.StatusCode.Should().Be(HttpStatusCode.Created);
        var resJson = await ReadJsonAsync(reservation);
        var reservationId = resJson.GetProperty("id").GetGuid();
        var reservationTotal = resJson.GetProperty("total").GetString();

        // Con reserva activa: itinerario protegido y reprogramación de salida protegida (006)
        var itinReq = CreateBearerRequest(HttpMethod.Put, $"/api/v1/admin/catalog/tours/{offerId}/itinerary", adminToken);
        itinReq.Content = JsonContent.Create(new
        {
            items = new[] { new { day = 1, title = "Cambio", description = "Nuevo" } }
        }, options: JsonOptions);
        var itinBlocked = await Client.SendAsync(itinReq, Ct);
        itinBlocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(itinBlocked)).GetProperty("code").GetString().Should().Be("itinerary_protected");

        var depRescheduleReq = CreateBearerRequest(HttpMethod.Put, $"/api/v1/admin/catalog/tours/{offerId}/departures/{depId}", adminToken);
        depRescheduleReq.Content = JsonContent.Create(new
        {
            startDate = start.AddHours(2),
            endDate = end.AddHours(2),
            price = "250.00",
            capacity = 12
        }, options: JsonOptions);
        var depBlocked = await Client.SendAsync(depRescheduleReq, Ct);
        depBlocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(depBlocked)).GetProperty("code").GetString().Should().Be("departure_protected");

        // Desactivar oferta oculta del público pero conserva intacta la reserva creada (006/RF-22)
        (await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/catalog/tours/{offerId}/deactivate", adminToken))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await Client.GetAsync($"/api/v1/catalog/tours/{offerId}", Ct))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        var preserved = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/reservations/{reservationId}", user.AccessToken);
        preserved.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(preserved)).GetProperty("total").GetString().Should().Be(reservationTotal);

        // Auditoría administrativa registrada para todos los cambios aplicados (DEC-078 / 006/RF-19)
        var audit = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=offer&entity={offerId}",
            adminToken);
        audit.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(audit)).GetProperty("total").GetInt32().Should().Be(4); // create, pricing, activate, deactivate
    }

    private async Task<Guid> CreateMobilityAsync(
        string adminToken,
        string name,
        string description,
        string type,
        int capacity)
    {
        var req = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/mobility", adminToken);
        req.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        req.Content = JsonContent.Create(new { name, description, type, capacity }, options: JsonOptions);
        var resp = await Client.SendAsync(req, Ct);
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var json = await ReadJsonAsync(resp);
        json.GetProperty("status").GetString().Should().Be("inactive");
        return json.GetProperty("id").GetGuid();
    }

    private async Task AttachMobilityImageAsync(Guid mobilityId, string url)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var item = await db.MobilityItems.SingleAsync(m => m.PublicId == mobilityId, Ct);
        item.SetImage(url, "image/jpeg", 50_000, DateTime.UtcNow);
        await db.SaveChangesAsync(Ct);
    }

    private async Task AttachOfferImageAsync(Guid offerId, string url)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var offer = await db.Offers.Include(o => o.Images).SingleAsync(o => o.PublicId == offerId, Ct);
        offer.AddImage(MediaAsset.CreateForOffer($"dev/{offerId:N}.jpg", url, "image/jpeg", 50_000, "main", 0, offer.Id));
        await db.SaveChangesAsync(Ct);
    }

    private async Task<string> CreateAdminTokenAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(Password), "Administrador catálogo"));
            await db.SaveChangesAsync(Ct);
        }

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password = Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await ReadJsonAsync(login)).GetProperty("accessToken").GetString()!;
    }
}
