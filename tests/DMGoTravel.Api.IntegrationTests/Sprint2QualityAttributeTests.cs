using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Pruebas de atributos de calidad del Sprint 2 contra PostgreSQL real:
/// - AC08 / ADR-015: disponibilidad de OpenAPI (/openapi/v1.yaml) y Swagger UI (/swagger).
/// - AC07: concurrencia sobre último cupo turístico (cero sobreventa).
/// - AC01: caché descriptiva pública con invalidación inmediata ante mutaciones administrativas.
/// </summary>
[Collection("Integration")]
public sealed class Sprint2QualityAttributeTests : ApiTestBase
{
    public Sprint2QualityAttributeTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Sprint 2 (ADR-015): sirve contrato OpenAPI 3.1 y Swagger UI interactivo")]
    public async Task OpenApiAndSwagger_ShouldBeServed()
    {
        var yamlResp = await Client.GetAsync("/openapi/v1.yaml", Ct);
        yamlResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var yaml = await yamlResp.Content.ReadAsStringAsync(Ct);
        yaml.Should().Contain("openapi: 3.1.0");
        yaml.Should().Contain("/api/v1/catalog/{type}");

        var swaggerResp = await Client.GetAsync("/swagger", Ct);
        swaggerResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var html = await swaggerResp.Content.ReadAsStringAsync(Ct);
        html.Should().Contain("SwaggerUIBundle");
        html.Should().Contain("/openapi/v1.yaml");
    }

    [Fact(DisplayName = "Sprint 2 (AC07): 8 reservas concurrentes por el último cupo turístico garantizan cero sobreventa")]
    public async Task Concurrency_LastTouristSeat_ShouldPreventOverselling()
    {
        Guid singleSeatDepartureId;

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var tour = await db.Offers.Include(o => o.Departures).FirstAsync(o => o.Type == OfferType.Tour, Ct);
            var dep = new TourDeparture(
                tour.Id,
                DateTime.UtcNow.AddDays(60),
                DateTime.UtcNow.AddDays(60).AddHours(8),
                capacityTotal: 1,
                priceNormal: Money.Create(150m));
            db.TourDepartures.Add(dep);
            await db.SaveChangesAsync(Ct);
            singleSeatDepartureId = dep.PublicId;
        }

        // Creamos 8 clientes verificados compitiendo simultáneamente por 1 único cupo
        var clients = new List<string>();
        for (var i = 0; i < 8; i++)
        {
            var user = await RegisterVerifiedUserAsync();
            clients.Add(user.AccessToken);
        }

        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var tasks = clients.Select(async token =>
        {
            await gate.Task;
            return await CreateReservationAsync(token, singleSeatDepartureId, travelers: 1);
        }).ToArray();

        gate.SetResult();
        var responses = await Task.WhenAll(tasks);

        var createdCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        createdCount.Should().Be(1, "solo un cliente debe adjudicarse el último cupo disponible");
        conflictCount.Should().Be(7, "los otros 7 intentos concurrentes deben rechazarse controladamente con 409");

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dep = await db.TourDepartures.AsNoTracking().SingleAsync(d => d.PublicId == singleSeatDepartureId, Ct);
            dep.CapacityCommitted.Should().Be(1);
            dep.AvailableCapacity.Should().Be(0);
        }
    }

    [Fact(DisplayName = "Sprint 2 (AC01): caché pública de catálogo se invalida automáticamente tras actualización")]
    public async Task PublicCatalogCache_ShouldInvalidateImmediatelyOnMutation()
    {
        var first = await Client.GetAsync("/api/v1/catalog/tours", Ct);
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var firstJson = await ReadJsonAsync(first);
        var initialTotal = firstJson.GetProperty("total").GetInt32();

        // Insertamos un nuevo tour activo directamente vía ApplicationDbContext (dispara SaveChanges -> invalidación)
        var uniqueName = $"Tour Cache Fresh {Guid.NewGuid():N}";
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var offer = Offer.Create(
                OfferType.Tour,
                uniqueName,
                "Tour de validación de invalidación de caché",
                1,
                DurationUnit.Days,
                Money.Create(99m),
                "Condición");
            offer.AddItineraryDay(new OfferItineraryDay(1, "Día 1", "Actividad"));
            offer.AddImage(MediaAsset.CreateForOffer("cache/a.jpg", "/api/v1/media/cache", "image/jpeg", 1024, "main", 1, 0, true));
            offer.Activate();
            db.Offers.Add(offer);
            await db.SaveChangesAsync(Ct);
        }

        var second = await Client.GetAsync("/api/v1/catalog/tours?pageSize=100", Ct);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        var secondBody = await second.Content.ReadAsStringAsync(Ct);
        secondBody.Should().Contain(uniqueName);
        using var doc = System.Text.Json.JsonDocument.Parse(secondBody);
        doc.RootElement.GetProperty("total").GetInt32().Should().Be(initialTotal + 1);
    }
}
