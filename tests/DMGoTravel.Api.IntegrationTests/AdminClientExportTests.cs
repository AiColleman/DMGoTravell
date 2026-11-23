using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
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
/// Cubre la exportación CSV de clientes (010/RF-27, RF-29-RF-31, RF-42-RF-45,
/// RF-47 y RF-53-RF-59): autorización vigente, filtros, captura completa, CSVs
/// vacíos, columnas autorizadas, privacidad de bajas y máscara aplicada antes de
/// la descarga. No sustituye la matriz de hojas de cálculo ni el snapshot
/// PostgreSQL exportado.
/// </summary>
[Collection("Integration")]
public sealed class AdminClientExportTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";
    private const string CsvHeader =
        "id,fullName,email,phone,registeredAt,emailVerified,status,reservationCount";

    public AdminClientExportTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Exportación clientes: exige admin, captura todo y entrega CSV autorizado")]
    public async Task Create_ShouldRequireAdminAndDeliverCompleteCsv()
    {
        var anonymous = await SendExportAsync(null, new { filters = new { } });
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var client = await RegisterVerifiedUserAsync();
        var forbidden = await SendExportAsync(
            client.AccessToken,
            new { filters = new { } });
        forbidden.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var admin = await CreateAdminAsync();
        var token = Guid.NewGuid().ToString("N")[..8];

        var ana = await CreateClientAsync(
            "=SUM(1,1) Ana, \"Pérez\"",
            $"ana-{token}@example.test",
            "+51999999999",
            new DateTime(2040, 1, 10, 15, 0, 0, DateTimeKind.Utc),
            emailVerified: true);
        var bruno = await CreateClientAsync(
            "Bruno\nLinea",
            $"bruno-{token}@example.test",
            null,
            new DateTime(2040, 1, 20, 15, 0, 0, DateTimeKind.Utc),
            status: UserStatus.Suspended);
        var deleted = await CreateClientAsync(
            $"Oculto-{token}",
            $"oculto-{token}@example.test",
            "+51888888888",
            new DateTime(2040, 1, 25, 15, 0, 0, DateTimeKind.Utc),
            deleted: true);
        var outside = await CreateClientAsync(
            $"Fuera-{token}",
            $"fuera-{token}@example.test",
            null,
            new DateTime(2039, 12, 31, 15, 0, 0, DateTimeKind.Utc));

        await AddReservationAsync(ana.Id, ReservationStatus.Confirmed);
        await AddReservationAsync(ana.Id, ReservationStatus.Cancelled);
        await AddReservationAsync(deleted.Id, ReservationStatus.Confirmed);
        await AddReservationAsync(deleted.Id, ReservationStatus.Cancelled);

        var accepted = await SendExportAsync(
            admin.AccessToken,
            new
            {
                filters = new
                {
                    registeredFrom = "2040-01-01",
                    registeredTo = "2040-01-31"
                }
            });
        accepted.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var acceptedJson = await ReadJsonAsync(accepted);
        var id = acceptedJson.GetProperty("id").GetGuid();
        var referenceAt = acceptedJson.GetProperty("referenceAt").GetDateTime();
        acceptedJson.GetProperty("status").GetString().Should().Be("accepted");
        acceptedJson.GetProperty("expiresAt").GetDateTime().Should().BeAfter(referenceAt);

        var status = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}",
            admin.AccessToken);
        status.StatusCode.Should().Be(HttpStatusCode.OK);
        var statusJson = await ReadJsonAsync(status);
        statusJson.GetProperty("kind").GetString().Should().Be("clients");
        statusJson.GetProperty("status").GetString().Should().Be("completed");
        statusJson.GetProperty("createdAt").GetDateTime()
            .Should().BeCloseTo(referenceAt, TimeSpan.FromMilliseconds(1));
        statusJson.GetProperty("downloadPath").GetString()
            .Should().Be($"/api/v1/admin/exports/{id:D}/download");

        var clientDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            client.AccessToken);
        clientDownload.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var download = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            admin.AccessToken);
        download.StatusCode.Should().Be(HttpStatusCode.OK);
        download.Content.Headers.ContentType!.MediaType.Should().Be("text/csv");
        download.Content.Headers.ContentType.CharSet.Should().Be("utf-8");
        download.Content.Headers.ContentDisposition!.DispositionType.Should().Be("attachment");
        download.Content.Headers.ContentDisposition.FileName.Should().Contain("clientes-");
        download.Headers.CacheControl.Should().NotBeNull();
        download.Headers.CacheControl!.NoStore.Should().BeTrue();
        DateTimeOffset.Parse(
                download.Headers.GetValues("X-Export-Reference-At").Single(),
                CultureInfo.InvariantCulture)
            .UtcDateTime.Should().BeCloseTo(referenceAt, TimeSpan.FromMilliseconds(1));

        var csv = await download.Content.ReadAsStringAsync(Ct);
        csv.Split("\r\n", StringSplitOptions.RemoveEmptyEntries)[0].Should().Be(CsvHeader);

        var deletedIndex = csv.IndexOf(deleted.PublicId.ToString("D"), StringComparison.Ordinal);
        var brunoIndex = csv.IndexOf(bruno.PublicId.ToString("D"), StringComparison.Ordinal);
        var anaIndex = csv.IndexOf(ana.PublicId.ToString("D"), StringComparison.Ordinal);

        deletedIndex.Should().BeGreaterThan(0);
        brunoIndex.Should().BeGreaterThan(deletedIndex);
        anaIndex.Should().BeGreaterThan(brunoIndex);

        csv.Should().Contain(
            $"{deleted.PublicId:D},,,,,,closed,2");
        csv.Should().NotContain($"Oculto-{token}");
        csv.Should().NotContain($"oculto-{token}@example.test");
        csv.Should().NotContain("+51888888888");

        csv.Should().Contain("'=SUM(1,1) Ana, \"\"Pérez\"\"");
        csv.Should().Contain("'+51999999999");
        csv.Should().Contain("\"Bruno\nLinea\"");
        csv.Should().Contain(",true,active,2\r\n");
        csv.Should().Contain(",suspended,0\r\n");
        csv.Should().NotContain(outside.PublicId.ToString("D"));
    }

    [Fact(DisplayName = "Exportación clientes: una baja posterior enmascara la fila y conserva la referencia")]
    public async Task Download_ShouldMaskLaterDeletionAndKeepCapturedCount()
    {
        var admin = await CreateAdminAsync();
        var token = Guid.NewGuid().ToString("N")[..8];

        var client = await CreateClientAsync(
            $"Cambia-{token}",
            $"cambia-{token}@example.test",
            "+51777777777",
            new DateTime(2041, 1, 10, 15, 0, 0, DateTimeKind.Utc),
            emailVerified: true);
        await AddReservationAsync(client.Id, ReservationStatus.Confirmed);

        var accepted = await SendExportAsync(
            admin.AccessToken,
            new
            {
                filters = new
                {
                    registeredFrom = "2041-01-01",
                    registeredTo = "2041-01-31"
                }
            });
        accepted.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var acceptedJson = await ReadJsonAsync(accepted);
        var id = acceptedJson.GetProperty("id").GetGuid();
        var referenceAt = acceptedJson.GetProperty("referenceAt").GetDateTime();

        await SoftDeleteClientAsync(client.Id);
        await AddReservationAsync(client.Id, ReservationStatus.Confirmed);

        var later = await CreateClientAsync(
            $"Nuevo-{token}",
            $"nuevo-{token}@example.test",
            null,
            new DateTime(2041, 1, 15, 15, 0, 0, DateTimeKind.Utc));

        var status = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}",
            admin.AccessToken);
        status.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(status)).GetProperty("createdAt").GetDateTime()
            .Should().BeCloseTo(referenceAt, TimeSpan.FromMilliseconds(1));

        var download = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            admin.AccessToken);
        download.StatusCode.Should().Be(HttpStatusCode.OK);
        DateTimeOffset.Parse(
                download.Headers.GetValues("X-Export-Reference-At").Single(),
                CultureInfo.InvariantCulture)
            .UtcDateTime.Should().BeCloseTo(referenceAt, TimeSpan.FromMilliseconds(1));

        var csv = await download.Content.ReadAsStringAsync(Ct);
        csv.Split("\r\n", StringSplitOptions.RemoveEmptyEntries)[0].Should().Be(CsvHeader);
        csv.Should().Contain($"{client.PublicId:D},,,,,,closed,1");
        csv.Should().NotContain($"Cambia-{token}");
        csv.Should().NotContain($"cambia-{token}@example.test");
        csv.Should().NotContain("+51777777777");
        csv.Should().NotContain(later.PublicId.ToString("D"));
        csv.Should().NotContain($"Nuevo-{token}");
    }

    [Fact(DisplayName = "Exportación clientes: aplica filtros, idempotencia y cabecera vacía")]
    public async Task Create_ShouldApplyFiltersReplayIdempotentlyAndKeepEmptyHeader()
    {
        var admin = await CreateAdminAsync();
        var token = Guid.NewGuid().ToString("N")[..8];

        var ana = await CreateClientAsync(
            $"Ana Filtro {token}",
            $"ana-{token}@example.test",
            null,
            new DateTime(2042, 2, 10, 15, 0, 0, DateTimeKind.Utc),
            emailVerified: true);
        var bruno = await CreateClientAsync(
            $"Bruno Filtro {token}",
            $"bruno-{token}@example.test",
            null,
            new DateTime(2042, 2, 20, 15, 0, 0, DateTimeKind.Utc),
            status: UserStatus.Suspended);

        var byName = await CreateAndDownloadAsync(
            admin.AccessToken,
            new
            {
                registeredFrom = "2042-02-01",
                registeredTo = "2042-02-28",
                name = $"ANA FILTRO {token}"
            });
        byName.Should().Contain(ana.PublicId.ToString("D"));
        byName.Should().NotContain(bruno.PublicId.ToString("D"));

        var byEmail = await CreateAndDownloadAsync(
            admin.AccessToken,
            new { email = $"BRUNO-{token}" });
        byEmail.Should().Contain(bruno.PublicId.ToString("D"));
        byEmail.Should().NotContain(ana.PublicId.ToString("D"));

        var byId = await CreateAndDownloadAsync(
            admin.AccessToken,
            new { id = ana.PublicId.ToString("D") });
        byId.Should().Contain(ana.PublicId.ToString("D"));
        byId.Should().NotContain(bruno.PublicId.ToString("D"));

        var byStatus = await CreateAndDownloadAsync(
            admin.AccessToken,
            new { status = "suspended" });
        byStatus.Should().Contain(bruno.PublicId.ToString("D"));
        byStatus.Should().NotContain(ana.PublicId.ToString("D"));

        var sameDay = await CreateAndDownloadAsync(
            admin.AccessToken,
            new
            {
                registeredFrom = "2042-02-10",
                registeredTo = "2042-02-10"
            });
        sameDay.Should().Contain(ana.PublicId.ToString("D"));
        sameDay.Should().NotContain(bruno.PublicId.ToString("D"));

        var empty = await CreateAndDownloadAsync(
            admin.AccessToken,
            new
            {
                registeredFrom = "2042-03-01",
                registeredTo = "2042-03-31"
            });
        empty.Should().Be($"{CsvHeader}\r\n");

        var missingBody = await SendExportAsync(
            admin.AccessToken,
            body: null,
            includeBody: false);
        missingBody.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var key = Guid.NewGuid().ToString("N");
        var first = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { status = "active" } },
            key);
        first.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var firstId = (await ReadJsonAsync(first)).GetProperty("id").GetGuid();

        var replay = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { status = "active" } },
            key);
        replay.StatusCode.Should().Be(HttpStatusCode.Accepted);
        (await ReadJsonAsync(replay)).GetProperty("id").GetGuid().Should().Be(firstId);

        var conflict = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { status = "suspended" } },
            key);
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadProblemCodeAsync(conflict)).Should().Be("idempotency_conflict");

        var withoutKey = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { status = "active" } },
            keys: false);
        withoutKey.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(withoutKey)).Should().Be("validation_failed");
    }

    [Fact(DisplayName = "Exportación clientes: valida filtros y reutiliza autorización y expiración")]
    public async Task Create_ShouldRejectInvalidFiltersAndDownloadShouldEnforceOwnership()
    {
        var admin = await CreateAdminAsync();
        var other = await CreateAdminAsync();

        var invalidUnknown = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { page = "1" } });
        invalidUnknown.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidUnknown)).Should().Be("invalid_filter");

        var invalidId = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { id = "no-es-uuid" } });
        invalidId.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidId)).Should().Be("invalid_filter");

        var invalidStatus = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { status = "inactive" } });
        invalidStatus.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidStatus)).Should().Be("invalid_filter");

        var invalidDate = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { registeredFrom = "2043-13-01" } });
        invalidDate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidDate)).Should().Be("invalid_range");

        var inverted = await SendExportAsync(
            admin.AccessToken,
            new
            {
                filters = new
                {
                    registeredFrom = "2043-02-01",
                    registeredTo = "2043-01-01"
                }
            });
        inverted.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(inverted)).Should().Be("invalid_range");

        var accepted = await SendExportAsync(
            admin.AccessToken,
            new
            {
                filters = new
                {
                    registeredFrom = "2043-01-01",
                    registeredTo = "2043-01-31"
                }
            });
        accepted.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var id = (await ReadJsonAsync(accepted)).GetProperty("id").GetGuid();

        var otherStatus = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}",
            other.AccessToken);
        otherStatus.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var otherDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            other.AccessToken);
        otherDownload.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var past = DateTime.UtcNow.AddMinutes(-1);
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE export_job SET \"ExpiresAtUtc\" = {past} WHERE \"PublicId\" = {id}",
                Ct);
        }

        var expiredStatus = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}",
            admin.AccessToken);
        expiredStatus.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(expiredStatus)).GetProperty("status").GetString()
            .Should().Be("expired");

        var expiredDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            admin.AccessToken);
        expiredDownload.StatusCode.Should().Be(HttpStatusCode.Gone);
        (await ReadProblemCodeAsync(expiredDownload)).Should().Be("export_expired");

        var fresh = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { status = "active" } });
        fresh.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var freshId = (await ReadJsonAsync(fresh)).GetProperty("id").GetGuid();

        await SoftDeleteAdminAsync(admin.Id);

        var revoked = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{freshId}/download",
            admin.AccessToken);
        revoked.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<string> CreateAndDownloadAsync(string accessToken, object filters)
    {
        var accepted = await SendExportAsync(accessToken, new { filters });
        accepted.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var id = (await ReadJsonAsync(accepted)).GetProperty("id").GetGuid();

        var download = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            accessToken);
        download.StatusCode.Should().Be(HttpStatusCode.OK);
        return await download.Content.ReadAsStringAsync(Ct);
    }

    private async Task<HttpResponseMessage> SendExportAsync(
        string? accessToken,
        object? body,
        string? idempotencyKey = null,
        bool includeBody = true,
        bool keys = true)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/v1/admin/exports/clients");

        if (accessToken is not null)
        {
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", accessToken);
        }

        if (keys)
        {
            request.Headers.Add(
                "Idempotency-Key",
                idempotencyKey ?? Guid.NewGuid().ToString("N"));
        }

        if (includeBody)
        {
            request.Content = JsonContent.Create(body ?? new { }, options: JsonOptions);
        }

        return await Client.SendAsync(request, Ct);
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
        string? phone,
        DateTime registeredAtUtc,
        bool deleted = false,
        bool emailVerified = false,
        UserStatus status = UserStatus.Active)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var user = User.CreateClient(email, hasher.Hash(Password), fullName, phone);
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

    private async Task SoftDeleteClientAsync(long accountId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(user => user.Id == accountId, Ct);
        user.SoftDelete();
        await db.SaveChangesAsync(Ct);
    }

    private async Task SoftDeleteAdminAsync(long accountId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(user => user.Id == accountId, Ct);
        user.SoftDelete();
        await db.SaveChangesAsync(Ct);
    }

    private async Task AddReservationAsync(long accountId, ReservationStatus status)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = new DateTime(2040, 1, 1, 0, 0, 0, DateTimeKind.Utc);
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
            [ReservationHold.CreateForTour(0, 1)],
            now);

        if (status == ReservationStatus.Confirmed)
        {
            reservation.ConfirmPayment(now.AddMinutes(1));
        }
        else if (status == ReservationStatus.Cancelled)
        {
            reservation.CancelByClient(now.AddMinutes(1));
        }

        db.Reservations.Add(reservation);
        await db.SaveChangesAsync(Ct);
    }

    private static async Task<string?> ReadProblemCodeAsync(HttpResponseMessage response)
    {
        var json = await ReadJsonAsync(response);
        return json.GetProperty("code").GetString();
    }

    private sealed record AdminUser(long Id, Guid PublicId, string AccessToken);

    private sealed record SeededClient(long Id, Guid PublicId, string FullName, string Email);
}
