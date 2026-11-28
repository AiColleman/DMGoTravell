using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Reservations.ExpireReservations;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Reservations;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Fase 4 (Spec 007 Hoteles y alojamiento en reservas) contra PostgreSQL real:
/// alta y activación de hotel, tipos de habitación, inventario por noche, propuestas por salida,
/// reserva atómica tour + alojamiento (sin bloqueo parcial), liberación en cancelación y vencimiento.
/// </summary>
[Collection("Integration")]
public sealed class HotelAndLodgingReservationTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public HotelAndLodgingReservationTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Hoteles y Alojamiento 007: flujo completo admin, consulta pública, reserva atómica, cancelación y vencimiento")]
    public async Task HotelLodgingEndToEnd_ShouldHoldProtectAndReleaseRoomsAtomically()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (_, departureId) = await GetTourAsync();

        // 1) Admin crea hotel (nace inactivo)
        var hotelReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/hotels", adminToken);
        hotelReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        hotelReq.Content = JsonContent.Create(new
        {
            name = "Hotel Andino Real",
            description = "Alojamiento céntrico con desayuno",
            services = new[] { "Desayuno", "Wi-Fi" }
        }, options: JsonOptions);
        var hotelResp = await Client.SendAsync(hotelReq, Ct);
        hotelResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var hotelId = (await ReadJsonAsync(hotelResp)).GetProperty("id").GetGuid();

        // Inactivo no es visible públicamente (007/RF-8, RF-11)
        (await Client.GetAsync($"/api/v1/hotels/{hotelId}", Ct)).StatusCode.Should().Be(HttpStatusCode.NotFound);

        // 2) Crear tipo de habitación y rechazar duplicado en el mismo hotel (007/RF-25)
        var rtReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/room-types", adminToken);
        rtReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        rtReq.Content = JsonContent.Create(new { name = "Habitación Doble", capacity = 2, basePrice = "180.00" }, options: JsonOptions);
        var rtResp = await Client.SendAsync(rtReq, Ct);
        rtResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var roomTypeId = (await ReadJsonAsync(rtResp)).GetProperty("id").GetGuid();

        var rtDupReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/room-types", adminToken);
        rtDupReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        rtDupReq.Content = JsonContent.Create(new { name = "  habitación doble ", capacity = 2, basePrice = "190.00" }, options: JsonOptions);
        (await Client.SendAsync(rtDupReq, Ct)).StatusCode.Should().Be(HttpStatusCode.Conflict);

        // 3) Adjuntar imagen, activar hotel y verificar en catálogo público
        await AttachHotelImageAsync(hotelId, "https://media.example.test/andino.jpg");
        (await SendWithBearerAsync(HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/activate", adminToken))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        // Configurar inventario: noche 1 = 2 habitaciones, noche 2 = 1 habitación
        var checkIn = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
        var night2 = checkIn.AddDays(1);
        var checkOut = checkIn.AddDays(2);

        await SetInventoryAsync(adminToken, roomTypeId, checkIn, 2);
        await SetInventoryAsync(adminToken, roomTypeId, night2, 1);

        var publicHotel = await Client.GetAsync($"/api/v1/hotels/{hotelId}", Ct);
        publicHotel.StatusCode.Should().Be(HttpStatusCode.OK);
        var publicHotelJson = await ReadJsonAsync(publicHotel);
        publicHotelJson.GetProperty("hasAvailability").GetBoolean().Should().BeTrue();
        publicHotelJson.GetProperty("roomTypes").GetArrayLength().Should().Be(1);

        // 4) Crear propuesta de alojamiento de 2 noches asociada a la salida
        var propReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/lodging-proposals", adminToken);
        propReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        propReq.Content = JsonContent.Create(new
        {
            departureId,
            hotelId,
            startDate = checkIn.ToDateTime(new TimeOnly(15, 0), DateTimeKind.Utc),
            endDate = checkOut.ToDateTime(new TimeOnly(12, 0), DateTimeKind.Utc)
        }, options: JsonOptions);
        var propResp = await Client.SendAsync(propReq, Ct);
        propResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var proposalId = (await ReadJsonAsync(propResp)).GetProperty("id").GetGuid();

        // Consulta pública de propuestas por salida (007/RF-35)
        var byDep = await Client.GetAsync($"/api/v1/departures/{departureId}/lodging", Ct);
        byDep.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(byDep)).GetProperty("items").EnumerateArray()
            .Should().Contain(p => p.GetProperty("id").GetGuid() == proposalId);

        // 5) Cliente reserva tour (2 × 120 = 240) + alojamiento (2 noches × 180 = 360) => total 600.00 PEN
        var res1 = await CreateReservationAsync(
            user.AccessToken,
            departureId,
            travelers: 2,
            lodging: new { proposalId, roomTypeId });
        res1.StatusCode.Should().Be(HttpStatusCode.Created);
        var res1Json = await ReadJsonAsync(res1);
        var res1Id = res1Json.GetProperty("id").GetGuid();
        var res1Version = res1Json.GetProperty("version").GetInt64();
        res1Json.GetProperty("total").GetString().Should().Be("600.00");
        res1Json.GetProperty("lodging").GetProperty("nights").GetInt32().Should().Be(2);
        res1Json.GetProperty("lodging").GetProperty("subtotal").GetString().Should().Be("360.00");

        // Verificar retención en ambas noches
        (await GetCommittedRoomsAsync(roomTypeId, checkIn)).Should().Be(1);
        (await GetCommittedRoomsAsync(roomTypeId, night2)).Should().Be(1);

        // Admin no puede reducir inventario de noche 2 por debajo de 1 comprometida (007/RF-30)
        var reduceReq = CreateBearerRequest(HttpMethod.Put, $"/api/v1/admin/room-types/{roomTypeId}/inventory", adminToken);
        reduceReq.Content = JsonContent.Create(new { date = night2.ToString("yyyy-MM-dd"), quantity = 0 }, options: JsonOptions);
        var reduceResp = await Client.SendAsync(reduceReq, Ct);
        reduceResp.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(reduceResp)).GetProperty("code").GetString().Should().Be("inventory_below_committed");

        // 6) Segunda reserva falla porque noche 2 ya no tiene disponibilidad -> NO debe bloquear noche 1 parcialmente (007/RF-38)
        var res2 = await CreateReservationAsync(
            user.AccessToken,
            departureId,
            travelers: 1,
            lodging: new { proposalId, roomTypeId });
        res2.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await GetCommittedRoomsAsync(roomTypeId, checkIn)).Should().Be(1);

        // 7) Cancelación del cliente libera ambas noches hotelera atómicamente
        var cancel1 = await CancelReservationAsync(user.AccessToken, res1Id, res1Version);
        cancel1.StatusCode.Should().Be(HttpStatusCode.OK);
        (await GetCommittedRoomsAsync(roomTypeId, checkIn)).Should().Be(0);
        (await GetCommittedRoomsAsync(roomTypeId, night2)).Should().Be(0);

        // 8) Nueva reserva con alojamiento que vence automáticamente (Spec 003/RF-8) también libera ambas noches
        var res3 = await CreateReservationAsync(
            user.AccessToken,
            departureId,
            travelers: 1,
            lodging: new { proposalId, roomTypeId });
        res3.StatusCode.Should().Be(HttpStatusCode.Created);
        var res3Id = (await ReadJsonAsync(res3)).GetProperty("id").GetGuid();
        (await GetCommittedRoomsAsync(roomTypeId, checkIn)).Should().Be(1);
        (await GetCommittedRoomsAsync(roomTypeId, night2)).Should().Be(1);

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var past = DateTime.UtcNow.AddMinutes(-5);
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE reservation
                SET "PaymentDeadlineAtUtc" = {past},
                    "ValidationDeadlineAtUtc" = {past}
                WHERE "PublicId" = {res3Id}
                """, Ct);

            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var expiry = await mediator.Send(new ProcessExpiredReservationsCommand(), Ct);

            var res3State = await db.Reservations.AsNoTracking().SingleAsync(r => r.PublicId == res3Id, Ct);
            res3State.Status.Should().Be(ReservationStatus.Cancelled);
            if (expiry.Cancelled == 0)
            {
                // El HostedService ReservationExpiryWorker ya procesó concurrentemente la cancelación
                res3State.CancellationOrigin.Should().Be(CancellationOrigin.Expiry);
            }
            else
            {
                expiry.Cancelled.Should().BeGreaterThanOrEqualTo(1);
            }
        }

        (await GetCommittedRoomsAsync(roomTypeId, checkIn)).Should().Be(0);
        (await GetCommittedRoomsAsync(roomTypeId, night2)).Should().Be(0);
    }

    private async Task SetInventoryAsync(string adminToken, Guid roomTypeId, DateOnly date, int quantity)
    {
        var req = CreateBearerRequest(HttpMethod.Put, $"/api/v1/admin/room-types/{roomTypeId}/inventory", adminToken);
        req.Content = JsonContent.Create(new { date = date.ToString("yyyy-MM-dd"), quantity }, options: JsonOptions);
        (await Client.SendAsync(req, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task AttachHotelImageAsync(Guid hotelId, string url)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hotel = await db.Hotels.SingleAsync(h => h.PublicId == hotelId, Ct);
        db.MediaAssets.Add(MediaAsset.CreateForHotel($"dev/{hotelId:N}.jpg", url, "image/jpeg", 50_000, "main", 0, hotel.Id));
        await db.SaveChangesAsync(Ct);
    }

    private async Task<int> GetCommittedRoomsAsync(Guid roomTypeId, DateOnly date)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var rt = await db.RoomTypes.AsNoTracking().SingleAsync(r => r.PublicId == roomTypeId, Ct);
        return await db.RoomInventoryNights.AsNoTracking()
            .Where(n => n.RoomTypeId == rt.Id && n.StayDate == date)
            .Select(n => n.QuantityCommitted)
            .SingleAsync(Ct);
    }

    private async Task<string> CreateAdminTokenAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(Password), "Administrador hoteles"));
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
