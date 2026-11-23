using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Cubre la porción implementada de exportación de auditoría (010/RF-27-RF-31,
/// RF-42, RF-57-RF-59): captura completa, CSV estable, filtros, idempotencia,
/// autorización vigente y expiración. No sustituye las pruebas de snapshot
/// concurrente ni la matriz de hojas de cálculo pendientes.
/// </summary>
[Collection("Integration")]
public sealed class AdminAuditExportTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AdminAuditExportTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Exportación auditoría: exige admin, captura todo y entrega CSV saneado")]
    public async Task Create_ShouldRequireAdminAndDeliverCompleteCsv()
    {
        var anonymous = await SendExportAsync(null, null);
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var client = await RegisterVerifiedUserAsync();
        var forbidden = await SendExportAsync(
            client.AccessToken,
            new { filters = new { type = "no-aplica" } });
        forbidden.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var admin = await CreateAdminAsync();
        var type = NewScopeType();
        var rows = await SeedRowsAsync(admin, type);

        var accepted = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { type } });
        accepted.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var acceptedJson = await ReadJsonAsync(accepted);
        var id = acceptedJson.GetProperty("id").GetGuid();
        acceptedJson.GetProperty("status").GetString().Should().Be("accepted");
        acceptedJson.GetProperty("referenceAt").GetDateTime().Should()
            .BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));
        acceptedJson.GetProperty("expiresAt").GetDateTime().Should()
            .BeAfter(acceptedJson.GetProperty("referenceAt").GetDateTime());

        var status = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}",
            admin.AccessToken);
        status.StatusCode.Should().Be(HttpStatusCode.OK);
        var statusJson = await ReadJsonAsync(status);
        statusJson.GetProperty("id").GetGuid().Should().Be(id);
        statusJson.GetProperty("kind").GetString().Should().Be("audit");
        statusJson.GetProperty("status").GetString().Should().Be("completed");
        statusJson.GetProperty("downloadPath").GetString()
            .Should().Be($"/api/v1/admin/exports/{id:D}/download");

        var download = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            admin.AccessToken);
        download.StatusCode.Should().Be(HttpStatusCode.OK);
        download.Content.Headers.ContentType!.MediaType.Should().Be("text/csv");
        download.Content.Headers.ContentType.CharSet.Should().Be("utf-8");
        download.Content.Headers.ContentDisposition!.DispositionType.Should().Be("attachment");
        download.Content.Headers.ContentDisposition.FileName.Should().Contain("auditoria-");
        DateTimeOffset.Parse(
                download.Headers.GetValues("X-Export-Reference-At").Single(),
                CultureInfo.InvariantCulture)
            .UtcDateTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(2));

        var csv = await download.Content.ReadAsStringAsync(Ct);
        var lines = csv.Split("\r\n", StringSplitOptions.RemoveEmptyEntries);
        lines[0].Should().Be(
            "id,actorType,actor,action,entity,entityId,occurredAt,recordedAt,correlationId,result,summary");
        lines.Should().HaveCount(6);
        lines[1].Should().StartWith(rows[4].PublicId.ToString("D"));
        lines[5].Should().StartWith(rows[0].PublicId.ToString("D"));

        csv.Should().Contain(rows[0].PublicId.ToString("D"));
        csv.Should().Contain("Registro de cuenta: correo verificado");
        csv.Should().Contain("Inicio de sesión: credenciales inválidas");
        csv.Should().Contain("'=SUM(1,1)");
        csv.Should().NotContain("secret@example.test");
        csv.Should().NotContain("family-secret");
        csv.Should().NotContain("secret-token");
    }

    [Fact(DisplayName = "Exportación auditoría: conserva cabeceras y filas coherentes con filtros exactos")]
    public async Task Create_ShouldApplyFiltersAndKeepEmptyHeader()
    {
        var admin = await CreateAdminAsync();
        var type = NewScopeType();
        var rows = await SeedRowsAsync(admin, type);

        var filtered = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { type, result = "failure" } });
        filtered.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var filteredId = (await ReadJsonAsync(filtered)).GetProperty("id").GetGuid();

        var filteredDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{filteredId}/download",
            admin.AccessToken);
        filteredDownload.StatusCode.Should().Be(HttpStatusCode.OK);
        var filteredCsv = await filteredDownload.Content.ReadAsStringAsync(Ct);
        filteredCsv.Split("\r\n", StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(2);
        filteredCsv.Should().Contain(rows[1].PublicId.ToString("D"));
        filteredCsv.Should().NotContain(rows[0].PublicId.ToString("D"));

        var dated = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { type, from = "2026-01-01", to = "2026-01-01" } });
        dated.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var datedId = (await ReadJsonAsync(dated)).GetProperty("id").GetGuid();

        var datedDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{datedId}/download",
            admin.AccessToken);
        datedDownload.StatusCode.Should().Be(HttpStatusCode.OK);
        var datedCsv = await datedDownload.Content.ReadAsStringAsync(Ct);
        // 1 de enero en America/Lima abarca de 05:00Z a 05:00Z del día siguiente.
        datedCsv.Split("\r\n", StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(4);

        var empty = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { type = $"{type}-sin-resultados" } });
        empty.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var emptyId = (await ReadJsonAsync(empty)).GetProperty("id").GetGuid();

        var emptyDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{emptyId}/download",
            admin.AccessToken);
        emptyDownload.StatusCode.Should().Be(HttpStatusCode.OK);
        var emptyCsv = await emptyDownload.Content.ReadAsStringAsync(Ct);
        emptyCsv.Should().Be(
            "id,actorType,actor,action,entity,entityId,occurredAt,recordedAt,correlationId,result,summary\r\n");
    }

    [Fact(DisplayName = "Exportación auditoría: el cuerpo es opcional")]
    public async Task Create_ShouldAcceptMissingBody()
    {
        var admin = await CreateAdminAsync();
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/v1/admin/exports/audit");
        request.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", admin.AccessToken);
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));

        var response = await Client.SendAsync(request, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var json = await ReadJsonAsync(response);
        json.GetProperty("id").GetGuid().Should().NotBeEmpty();
    }

    [Fact(DisplayName = "Exportación auditoría: repite por clave y rechaza reutilización con otro cuerpo")]
    public async Task Create_ShouldReplayIdempotentlyAndRejectDifferentBody()
    {
        var admin = await CreateAdminAsync();
        var key = Guid.NewGuid().ToString("N");
        var body = new { filters = new { result = "success" } };

        var first = await SendExportAsync(admin.AccessToken, body, key);
        first.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var firstId = (await ReadJsonAsync(first)).GetProperty("id").GetGuid();

        var replay = await SendExportAsync(admin.AccessToken, body, key);
        replay.StatusCode.Should().Be(HttpStatusCode.Accepted);
        (await ReadJsonAsync(replay)).GetProperty("id").GetGuid().Should().Be(firstId);

        var conflict = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { result = "failure" } },
            key);
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadProblemCodeAsync(conflict)).Should().Be("idempotency_conflict");

        var withoutKey = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/v1/admin/exports/audit");
        withoutKey.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", admin.AccessToken);
        withoutKey.Content = JsonContent.Create(new { }, options: JsonOptions);

        var missingKey = await Client.SendAsync(withoutKey, Ct);
        missingKey.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(missingKey)).Should().Be("validation_failed");
    }

    [Fact(DisplayName = "Exportación auditoría: aísla por solicitante y expira la descarga")]
    public async Task GetAndDownload_ShouldEnforceOwnershipAndExpiry()
    {
        var owner = await CreateAdminAsync();
        var other = await CreateAdminAsync();

        var accepted = await SendExportAsync(
            owner.AccessToken,
            new { filters = new { type = "sin-datos" } });
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
            owner.AccessToken);
        expiredStatus.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(expiredStatus)).GetProperty("status").GetString()
            .Should().Be("expired");

        var expiredDownload = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/exports/{id}/download",
            owner.AccessToken);
        expiredDownload.StatusCode.Should().Be(HttpStatusCode.Gone);
        (await ReadProblemCodeAsync(expiredDownload)).Should().Be("export_expired");
    }

    [Fact(DisplayName = "Exportación auditoría: valida filtros, fechas, actor y resultado")]
    public async Task Create_ShouldRejectInvalidFilters()
    {
        var admin = await CreateAdminAsync();

        var unknown = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { page = "1" } });
        unknown.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(unknown)).Should().Be("invalid_filter");

        var inverted = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { from = "2026-02-01", to = "2026-01-01" } });
        inverted.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(inverted)).Should().Be("invalid_range");

        var invalidDate = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { from = "2026-13-01" } });
        invalidDate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidDate)).Should().Be("invalid_range");

        var invalidActor = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { actor = "someone@example.test" } });
        invalidActor.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidActor)).Should().Be("invalid_filter");

        var invalidResult = await SendExportAsync(
            admin.AccessToken,
            new { filters = new { result = "unknown" } });
        invalidResult.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidResult)).Should().Be("invalid_filter");
    }

    private async Task<HttpResponseMessage> SendExportAsync(
        string? accessToken,
        object? body,
        string? idempotencyKey = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/exports/audit");
        if (accessToken is not null)
        {
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer",
                accessToken);
        }

        request.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        request.Content = JsonContent.Create(body ?? new { }, options: JsonOptions);
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

    private async Task<IReadOnlyList<SeedRow>> SeedRowsAsync(AdminUser admin, string type)
    {
        var token = Guid.NewGuid().ToString("N")[..8];
        var entity1 = Guid.NewGuid().ToString("D");
        var entity2 = Guid.NewGuid().ToString("D");
        var entity3 = Guid.NewGuid().ToString("D");

        var specs = new List<SeedSpec>
        {
            new(
                AuditActions.Register,
                AuditActions.ActorHuman,
                admin.Id,
                entity1,
                new DateTime(2026, 1, 1, 5, 0, 0, DateTimeKind.Utc),
                $"{token}-alpha",
                AuditActions.Success,
                "{\"emailVerified\":true,\"email\":\"secret@example.test\",\"familyId\":\"family-secret\"}"),
            new(
                AuditActions.Login,
                AuditActions.ActorHuman,
                admin.Id,
                entity2,
                new DateTime(2026, 1, 1, 6, 0, 0, DateTimeKind.Utc),
                $"{token}-beta",
                AuditActions.Failure,
                "{\"reason\":\"invalid_credentials\",\"token\":\"secret-token\"}"),
            new(
                AuditActions.VerifyEmail,
                AuditActions.ActorSystem,
                null,
                entity3,
                new DateTime(2026, 1, 2, 4, 59, 59, DateTimeKind.Utc),
                $"{token}-gamma",
                AuditActions.Success,
                "{\"emailVerified\":true}"),
            new(
                AuditActions.Refresh,
                AuditActions.ActorHuman,
                admin.Id,
                entity1,
                new DateTime(2026, 1, 2, 5, 0, 0, DateTimeKind.Utc),
                "=SUM(1,1)",
                AuditActions.Success,
                "{\"rotated\":true}"),
            new(
                AuditActions.Logout,
                AuditActions.ActorHuman,
                admin.Id,
                entity1,
                new DateTime(2026, 1, 2, 5, 0, 0, DateTimeKind.Utc),
                $"{token}-epsilon",
                AuditActions.Success,
                "{\"loggedOut\":true}")
        };

        var result = new List<SeedRow>(specs.Count);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        foreach (var spec in specs)
        {
            var publicId = Guid.NewGuid();
            var row = AuditLog.Create(
                "test",
                spec.Action,
                spec.ActorType,
                spec.ActorId,
                spec.Action,
                type,
                spec.EntityId,
                spec.OccurredAt,
                spec.CorrelationId,
                spec.Result,
                spec.ChangesJson);

            db.AuditLogs.Add(row);
            db.Entry(row).Property(nameof(AuditLog.PublicId)).CurrentValue = publicId;
            result.Add(new SeedRow(publicId));
        }

        await db.SaveChangesAsync(Ct);
        return result;
    }

    private static async Task<string?> ReadProblemCodeAsync(HttpResponseMessage response)
    {
        var json = await ReadJsonAsync(response);
        return json.GetProperty("code").GetString();
    }

    private static string NewScopeType() => $"test_export_{Guid.NewGuid():N}";

    private sealed record AdminUser(long Id, Guid PublicId, string AccessToken);

    private sealed record SeedRow(Guid PublicId);

    private sealed record SeedSpec(
        string Action,
        string ActorType,
        long? ActorId,
        string EntityId,
        DateTime OccurredAt,
        string CorrelationId,
        string Result,
        string ChangesJson);
}
