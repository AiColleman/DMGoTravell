using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Reservations;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Cubre la consulta y el detalle administrativo de clientes (010/RF-3-RF-6,
/// RF-8, RF-44, RF-48-RF-54): autorización vigente, filtros exactos, orden,
/// conteo de reservas en los cuatro estados y restricción de bajas lógicas.
/// No cubre todavía la exportación CSV de clientes ni la pantalla administrativa.
/// </summary>
[Collection("Integration")]
public sealed class AdminClientTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AdminClientTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Clientes admin: exige autenticación y rol administrador")]
    public async Task Endpoints_ShouldRequireAuthenticatedAdmin()
    {
        var anonymousList = await Client.GetAsync("/api/v1/admin/clients", Ct);
        anonymousList.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var client = await RegisterVerifiedUserAsync();
        var clientList = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients",
            client.AccessToken);
        clientList.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var admin = await CreateAdminAsync();
        var adminList = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients",
            admin.AccessToken);
        adminList.StatusCode.Should().Be(HttpStatusCode.OK);

        var unknownClient = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients/{Guid.NewGuid():D}",
            client.AccessToken);
        unknownClient.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact(DisplayName = "Clientes admin: filtra, pagina, ordena y cuenta reservas sin duplicar")]
    public async Task List_ShouldFilterPaginateOrderAndCountReservations()
    {
        var admin = await CreateAdminAsync();
        var token = Guid.NewGuid().ToString("N")[..8];

        var ana = await CreateClientAsync(
            $"Ana-{token}",
            $"ana-{token}@example.test",
            new DateTime(2035, 1, 10, 15, 0, 0, DateTimeKind.Utc),
            emailVerified: true);
        var bruno = await CreateClientAsync(
            $"Bruno-{token}",
            $"bruno-{token}@example.test",
            new DateTime(2035, 1, 20, 15, 0, 0, DateTimeKind.Utc));
        var carla = await CreateClientAsync(
            $"Carla-{token}",
            $"carla-{token}@example.test",
            new DateTime(2035, 1, 20, 15, 0, 0, DateTimeKind.Utc));
        var deleted = await CreateClientAsync(
            $"Oculto-{token}",
            $"oculto-{token}@example.test",
            new DateTime(2035, 2, 5, 15, 0, 0, DateTimeKind.Utc),
            deleted: true);

        // Ana tiene una reserva por cada estado; la pendiente conserva dos holds
        // y aun así debe contar una sola vez.
        await AddReservationAsync(ana.Id, ReservationStatus.Pending, holds: 2);
        await AddReservationAsync(ana.Id, ReservationStatus.Confirmed);
        await AddReservationAsync(ana.Id, ReservationStatus.Completed);
        await AddReservationAsync(ana.Id, ReservationStatus.Cancelled);
        await AddReservationAsync(carla.Id, ReservationStatus.Pending);
        await AddReservationAsync(deleted.Id, ReservationStatus.Confirmed);
        await AddReservationAsync(deleted.Id, ReservationStatus.Cancelled);

        var range = "?registeredFrom=2035-01-01&registeredTo=2035-02-28";

        var firstPage = await GetListAsync(
            admin.AccessToken,
            $"{range}&page=1&pageSize=2");
        firstPage.GetProperty("page").GetInt32().Should().Be(1);
        firstPage.GetProperty("pageSize").GetInt32().Should().Be(2);
        firstPage.GetProperty("total").GetInt32().Should().Be(4);
        firstPage.GetProperty("hasNext").GetBoolean().Should().BeTrue();
        AssertIds(firstPage, deleted.PublicId, carla.PublicId);

        var secondPage = await GetListAsync(
            admin.AccessToken,
            $"{range}&page=2&pageSize=2");
        secondPage.GetProperty("total").GetInt32().Should().Be(4);
        secondPage.GetProperty("hasNext").GetBoolean().Should().BeFalse();
        AssertIds(secondPage, bruno.PublicId, ana.PublicId);

        var emptyPage = await GetListAsync(
            admin.AccessToken,
            $"{range}&page=3&pageSize=2");
        emptyPage.GetProperty("total").GetInt32().Should().Be(4);
        emptyPage.GetProperty("hasNext").GetBoolean().Should().BeFalse();
        emptyPage.GetProperty("items").GetArrayLength().Should().Be(0);

        var anaItem = FindItem(firstPage, secondPage, ana.PublicId);
        anaItem.GetProperty("fullName").GetString().Should().Be(ana.FullName);
        anaItem.GetProperty("email").GetString().Should().Be(ana.Email);
        anaItem.GetProperty("phone").GetString().Should().Be("+51999999999");
        anaItem.GetProperty("emailVerified").GetBoolean().Should().BeTrue();
        anaItem.GetProperty("status").GetString().Should().Be("active");
        anaItem.GetProperty("reservationCount").GetInt32().Should().Be(4);
        anaItem.GetProperty("registeredAt").GetDateTime().Kind.Should().Be(DateTimeKind.Utc);

        var brunoItem = FindItem(firstPage, secondPage, bruno.PublicId);
        brunoItem.GetProperty("reservationCount").GetInt32().Should().Be(0);

        var deletedItem = FindItem(firstPage, secondPage, deleted.PublicId);
        deletedItem.GetProperty("status").GetString().Should().Be("closed");
        deletedItem.GetProperty("reservationCount").GetInt32().Should().Be(2);
        deletedItem.TryGetProperty("fullName", out _).Should().BeFalse();
        deletedItem.TryGetProperty("email", out _).Should().BeFalse();
        deletedItem.TryGetProperty("phone", out _).Should().BeFalse();
        deletedItem.TryGetProperty("emailVerified", out _).Should().BeFalse();
        deletedItem.TryGetProperty("registeredAt", out _).Should().BeFalse();

        var byName = await GetListAsync(
            admin.AccessToken,
            $"{range}&name={Uri.EscapeDataString($"ANA-{token}".ToUpperInvariant())}");
        byName.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(byName, ana.PublicId);

        var byEmail = await GetListAsync(
            admin.AccessToken,
            $"{range}&email={Uri.EscapeDataString($"BRUNO-{token}".ToUpperInvariant())}");
        byEmail.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(byEmail, bruno.PublicId);

        var byId = await GetListAsync(
            admin.AccessToken,
            $"{range}&id={carla.PublicId:D}");
        byId.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(byId, carla.PublicId);

        var closed = await GetListAsync(
            admin.AccessToken,
            $"{range}&status=closed");
        closed.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(closed, deleted.PublicId);

        var active = await GetListAsync(
            admin.AccessToken,
            $"{range}&status=active");
        active.GetProperty("total").GetInt32().Should().Be(3);

        var sameDay = await GetListAsync(
            admin.AccessToken,
            "?registeredFrom=2035-01-10&registeredTo=2035-01-10");
        sameDay.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(sameDay, ana.PublicId);

        var hiddenName = await GetListAsync(
            admin.AccessToken,
            $"?name={Uri.EscapeDataString($"Oculto-{token}")}");
        hiddenName.GetProperty("total").GetInt32().Should().Be(0);

        var hiddenEmail = await GetListAsync(
            admin.AccessToken,
            $"?email={Uri.EscapeDataString($"oculto-{token}")}");
        hiddenEmail.GetProperty("total").GetInt32().Should().Be(0);
    }

    [Fact(DisplayName = "Clientes admin: detalle autorizado, baja restringida y 404")]
    public async Task Get_ShouldReturnAuthorizedDetailAndRestrictDeletedClient()
    {
        var admin = await CreateAdminAsync();
        var token = Guid.NewGuid().ToString("N")[..8];

        var ana = await CreateClientAsync(
            $"Ana-{token}",
            $"ana-{token}@example.test",
            new DateTime(2035, 3, 10, 15, 0, 0, DateTimeKind.Utc),
            emailVerified: true);
        await AddReservationAsync(ana.Id, ReservationStatus.Confirmed);
        await AddReservationAsync(ana.Id, ReservationStatus.Cancelled);

        var deleted = await CreateClientAsync(
            $"Oculto-{token}",
            $"oculto-{token}@example.test",
            new DateTime(2035, 3, 20, 15, 0, 0, DateTimeKind.Utc),
            deleted: true);
        var suspended = await CreateClientAsync(
            $"Suspendido-{token}",
            $"suspendido-{token}@example.test",
            new DateTime(2035, 3, 25, 15, 0, 0, DateTimeKind.Utc),
            status: UserStatus.Suspended);

        var detail = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients/{ana.PublicId:D}",
            admin.AccessToken);
        detail.StatusCode.Should().Be(HttpStatusCode.OK);
        var detailJson = await ReadJsonAsync(detail);
        detailJson.GetProperty("id").GetGuid().Should().Be(ana.PublicId);
        detailJson.GetProperty("fullName").GetString().Should().Be(ana.FullName);
        detailJson.GetProperty("email").GetString().Should().Be(ana.Email);
        detailJson.GetProperty("phone").GetString().Should().Be("+51999999999");
        detailJson.GetProperty("emailVerified").GetBoolean().Should().BeTrue();
        detailJson.GetProperty("status").GetString().Should().Be("active");
        detailJson.GetProperty("reservationCount").GetInt32().Should().Be(2);
        detailJson.GetProperty("registeredAt").GetDateTime().Kind.Should().Be(DateTimeKind.Utc);

        var deletedDetail = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients/{deleted.PublicId:D}",
            admin.AccessToken);
        deletedDetail.StatusCode.Should().Be(HttpStatusCode.OK);
        var deletedJson = await ReadJsonAsync(deletedDetail);
        deletedJson.GetProperty("id").GetGuid().Should().Be(deleted.PublicId);
        deletedJson.GetProperty("status").GetString().Should().Be("closed");
        deletedJson.GetProperty("reservationCount").GetInt32().Should().Be(0);
        deletedJson.TryGetProperty("fullName", out _).Should().BeFalse();
        deletedJson.TryGetProperty("email", out _).Should().BeFalse();
        deletedJson.TryGetProperty("phone", out _).Should().BeFalse();
        deletedJson.TryGetProperty("emailVerified", out _).Should().BeFalse();
        deletedJson.TryGetProperty("registeredAt", out _).Should().BeFalse();

        var suspendedDetail = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients/{suspended.PublicId:D}",
            admin.AccessToken);
        suspendedDetail.StatusCode.Should().Be(HttpStatusCode.OK);
        var suspendedJson = await ReadJsonAsync(suspendedDetail);
        suspendedJson.GetProperty("status").GetString().Should().Be("suspended");
        suspendedJson.GetProperty("fullName").GetString().Should().Be(suspended.FullName);
        suspendedJson.GetProperty("email").GetString().Should().Be(suspended.Email);

        var suspendedList = await GetListAsync(
            admin.AccessToken,
            "?registeredFrom=2035-03-25&registeredTo=2035-03-25&status=suspended");
        suspendedList.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(suspendedList, suspended.PublicId);

        var missing = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients/{Guid.NewGuid():D}",
            admin.AccessToken);
        missing.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var adminDetail = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients/{admin.PublicId:D}",
            admin.AccessToken);
        adminDetail.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact(DisplayName = "Clientes admin: rechaza paginación, estado, ID y fechas inválidas")]
    public async Task List_ShouldRejectInvalidParameters()
    {
        var admin = await CreateAdminAsync();

        var invalidPage = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients?page=0",
            admin.AccessToken);
        invalidPage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidPage)).Should().Be("invalid_page");

        var invalidPageSize = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients?pageSize=101",
            admin.AccessToken);
        invalidPageSize.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidPageSize)).Should().Be("invalid_filter");

        var invalidId = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients?id=no-es-uuid",
            admin.AccessToken);
        invalidId.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidId)).Should().Be("invalid_filter");

        var invalidStatus = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients?status=inactive",
            admin.AccessToken);
        invalidStatus.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidStatus)).Should().Be("invalid_filter");

        var invalidDate = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients?registeredFrom=2035-13-01",
            admin.AccessToken);
        invalidDate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidDate)).Should().Be("invalid_range");

        var invertedRange = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/clients?registeredFrom=2035-02-01&registeredTo=2035-01-01",
            admin.AccessToken);
        invertedRange.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invertedRange)).Should().Be("invalid_range");

        var blankFilters = await GetListAsync(
            admin.AccessToken,
            "?registeredFrom=2036-01-01&registeredTo=2036-12-31&name=%20%20&email=%20");
        blankFilters.GetProperty("total").GetInt32().Should().Be(0);
    }

    private async Task<AdminUser> CreateAdminAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var admin = User.CreateAdmin(email, hasher.Hash(Password), "Administrador ficticio");
        db.Users.Add(admin);
        await db.SaveChangesAsync(Ct);

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password = Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ReadJsonAsync(login);
        var accessToken = json.GetProperty("accessToken").GetString();

        return new AdminUser(admin.Id, admin.PublicId, accessToken!);
    }

    private async Task<SeededClient> CreateClientAsync(
        string fullName,
        string email,
        DateTime registeredAtUtc,
        bool deleted = false,
        bool emailVerified = false,
        UserStatus status = UserStatus.Active)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var user = User.CreateClient(email, hasher.Hash(Password), fullName, "+51999999999");
        if (deleted)
        {
            user.SoftDelete();
        }

        db.Users.Add(user);
        await db.SaveChangesAsync(Ct);

        var entry = db.Entry(user);
        entry.Property(nameof(User.CreatedAtUtc)).CurrentValue = registeredAtUtc;
        entry.Property(nameof(User.IsEmailVerified)).CurrentValue = emailVerified;
        if (!deleted)
        {
            entry.Property(nameof(User.Status)).CurrentValue = status;
        }
        await db.SaveChangesAsync(Ct);

        return new SeededClient(user.Id, user.PublicId, fullName, email);
    }

    private async Task AddReservationAsync(
        long accountId,
        ReservationStatus status,
        int holds = 1)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = new DateTime(2035, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var snapshot = new ReservationOfferSnapshot(
            "tour",
            "Tour ficticio",
            now.AddDays(30),
            now.AddDays(31),
            1,
            Money.Create(100m));

        var reservation = Reservation.Create(
            $"R-{Guid.NewGuid():N}".ToUpperInvariant(),
            accountId,
            0,
            0,
            snapshot,
            null,
            Enumerable.Range(0, holds)
                .Select(_ => ReservationHold.CreateForTour(0, 1))
                .ToArray(),
            now);

        switch (status)
        {
            case ReservationStatus.Confirmed:
                reservation.ConfirmPayment(now.AddMinutes(1));
                break;
            case ReservationStatus.Completed:
                db.Reservations.Add(reservation);
                db.Entry(reservation)
                    .Property(nameof(Reservation.Status))
                    .CurrentValue = ReservationStatus.Completed;
                await db.SaveChangesAsync(Ct);
                return;
            case ReservationStatus.Cancelled:
                reservation.CancelByClient(now.AddMinutes(1));
                break;
        }

        db.Reservations.Add(reservation);
        await db.SaveChangesAsync(Ct);
    }

    private async Task<JsonElement> GetListAsync(string accessToken, string query)
    {
        var response = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/clients{query}",
            accessToken);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return await ReadJsonAsync(response);
    }

    private static JsonElement FindItem(JsonElement firstPage, JsonElement secondPage, Guid id)
    {
        var items = firstPage.GetProperty("items")
            .EnumerateArray()
            .Concat(secondPage.GetProperty("items").EnumerateArray());

        return items.Single(item => item.GetProperty("id").GetGuid() == id);
    }

    private static void AssertIds(JsonElement page, params Guid[] expected)
    {
        var actual = page.GetProperty("items")
            .EnumerateArray()
            .Select(item => item.GetProperty("id").GetGuid())
            .ToArray();

        actual.Should().Equal(expected);
    }

    private static async Task<string?> ReadProblemCodeAsync(HttpResponseMessage response)
    {
        var json = await ReadJsonAsync(response);
        return json.GetProperty("code").GetString();
    }

    private sealed record AdminUser(long Id, Guid PublicId, string AccessToken);

    private sealed record SeededClient(long Id, Guid PublicId, string FullName, string Email);
}
