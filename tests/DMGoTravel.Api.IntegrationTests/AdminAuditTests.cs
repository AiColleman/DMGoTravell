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
/// Verifica la consulta y el detalle administrativo de auditoría (010/RF-22-RF-25,
/// RF-48-RF-52): autorización vigente, filtros exactos, paginación, orden estable,
/// identificadores públicos y resumen sin datos personales ni secretos.
/// </summary>
[Collection("Integration")]
public sealed class AdminAuditTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AdminAuditTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Auditoría admin: exige autenticación y rol administrador")]
    public async Task List_ShouldRequireAuthenticatedAdmin()
    {
        var anonymous = await Client.GetAsync("/api/v1/admin/audit", Ct);
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var client = await RegisterVerifiedUserAsync();
        var clientResponse = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit",
            client.AccessToken);
        clientResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var admin = await CreateAdminAsync();
        var adminResponse = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit",
            admin.AccessToken);
        adminResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact(DisplayName = "Auditoría admin: filtra, pagina y ordena por operación e ID descendente")]
    public async Task List_ShouldFilterPaginateAndOrderStably()
    {
        var admin = await CreateAdminAsync();
        var type = NewScopeType();
        var rows = await SeedRowsAsync(admin, type);

        var firstPage = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&page=1&pageSize=2");
        firstPage.GetProperty("page").GetInt32().Should().Be(1);
        firstPage.GetProperty("pageSize").GetInt32().Should().Be(2);
        firstPage.GetProperty("total").GetInt32().Should().Be(5);
        firstPage.GetProperty("hasNext").GetBoolean().Should().BeTrue();
        AssertIds(firstPage, rows[4].PublicId, rows[3].PublicId);

        var thirdPage = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&page=3&pageSize=2");
        thirdPage.GetProperty("total").GetInt32().Should().Be(5);
        thirdPage.GetProperty("hasNext").GetBoolean().Should().BeFalse();
        AssertIds(thirdPage, rows[0].PublicId);

        var emptyPage = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&page=4&pageSize=2");
        emptyPage.GetProperty("total").GetInt32().Should().Be(5);
        emptyPage.GetProperty("hasNext").GetBoolean().Should().BeFalse();
        emptyPage.GetProperty("items").GetArrayLength().Should().Be(0);

        var byEntity = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&entity={Uri.EscapeDataString(rows[0].EntityId)}");
        byEntity.GetProperty("total").GetInt32().Should().Be(3);
        AssertIds(byEntity, rows[4].PublicId, rows[3].PublicId, rows[0].PublicId);

        var byActor = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&actor={admin.PublicId}");
        byActor.GetProperty("total").GetInt32().Should().Be(4);
        AssertIds(byActor, rows[4].PublicId, rows[3].PublicId, rows[1].PublicId, rows[0].PublicId);

        var systemActor = await GetListAsync(admin.AccessToken, $"?type={type}&actor=system");
        systemActor.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(systemActor, rows[2].PublicId);

        var byResult = await GetListAsync(admin.AccessToken, $"?type={type}&result=failure");
        byResult.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(byResult, rows[1].PublicId);

        var byAction = await GetListAsync(admin.AccessToken, $"?type={type}&action={AuditActions.Register}");
        byAction.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(byAction, rows[0].PublicId);

        var byCorrelation = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&correlationId={rows[1].CorrelationId}");
        byCorrelation.GetProperty("total").GetInt32().Should().Be(1);
        AssertIds(byCorrelation, rows[1].PublicId);

        var januaryFirst = await GetListAsync(
            admin.AccessToken,
            $"?type={type}&from=2026-01-01&to=2026-01-01");
        januaryFirst.GetProperty("total").GetInt32().Should().Be(3);
        AssertIds(januaryFirst, rows[2].PublicId, rows[1].PublicId, rows[0].PublicId);
    }

    [Fact(DisplayName = "Auditoría admin: detalle devuelve IDs públicos y resumen saneado")]
    public async Task Get_ShouldReturnPublicIdAndSanitizedSummary()
    {
        var admin = await CreateAdminAsync();
        var type = NewScopeType();
        var rows = await SeedRowsAsync(admin, type);

        var response = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit/{rows[0].PublicId}",
            admin.AccessToken);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ReadJsonAsync(response);
        json.GetProperty("id").GetGuid().Should().Be(rows[0].PublicId);
        json.GetProperty("occurredAt").GetDateTime().Kind.Should().Be(DateTimeKind.Utc);
        json.GetProperty("actor").GetString().Should().Be(admin.PublicId.ToString());
        json.GetProperty("entity").GetString().Should().Be(type);
        json.GetProperty("entityId").GetString().Should().Be(rows[0].EntityId);
        json.GetProperty("action").GetString().Should().Be(AuditActions.Register);
        json.GetProperty("result").GetString().Should().Be(AuditActions.Success);
        json.GetProperty("correlationId").GetString().Should().Be(rows[0].CorrelationId);
        json.GetProperty("summary").GetString().Should().Be("Registro de cuenta: correo verificado");

        var raw = json.GetRawText();
        raw.Should().NotContain("secret@example.test");
        raw.Should().NotContain("family-secret");
        raw.Should().NotContain("secret-token");

        var failedLogin = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit/{rows[1].PublicId}",
            admin.AccessToken);
        failedLogin.StatusCode.Should().Be(HttpStatusCode.OK);
        var failedJson = await ReadJsonAsync(failedLogin);
        failedJson.GetProperty("summary").GetString()
            .Should().Be("Inicio de sesión: credenciales inválidas");
        failedJson.GetRawText().Should().NotContain("secret-token");

        var missing = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit/{Guid.NewGuid()}",
            admin.AccessToken);
        missing.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact(DisplayName = "Auditoría admin: rol o familia revocados bloquean el acceso con el token anterior")]
    public async Task List_ShouldFailClosedWhenRoleOrSessionIsNoLongerCurrent()
    {
        var admin = await CreateAdminAsync();
        var initial = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit",
            admin.AccessToken);
        initial.StatusCode.Should().Be(HttpStatusCode.OK);

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.SingleAsync(candidate => candidate.Id == admin.Id, Ct);
            db.Entry(user).Property(nameof(User.Role)).CurrentValue = UserRole.Client;
            await db.SaveChangesAsync(Ct);
        }

        var afterRoleChange = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit",
            admin.AccessToken);
        afterRoleChange.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var secondAdmin = await CreateAdminAsync();
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var refreshTokens = scope.ServiceProvider.GetRequiredService<IRefreshTokenRepository>();
            await refreshTokens.RevokeAllForUserAsync(secondAdmin.Id, DateTime.UtcNow, Ct);
            await db.SaveChangesAsync(Ct);
        }

        var afterSessionRevocation = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit",
            secondAdmin.AccessToken);
        afterSessionRevocation.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact(DisplayName = "Auditoría admin: rechaza paginación, fechas, actor y resultado inválidos")]
    public async Task List_ShouldRejectInvalidParameters()
    {
        var admin = await CreateAdminAsync();

        var invalidPage = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit?page=0",
            admin.AccessToken);
        invalidPage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidPage)).Should().Be("invalid_page");

        var invalidPageSize = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit?pageSize=101",
            admin.AccessToken);
        invalidPageSize.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidPageSize)).Should().Be("invalid_filter");

        var invertedRange = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit?from=2026-02-01&to=2026-01-01",
            admin.AccessToken);
        invertedRange.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invertedRange)).Should().Be("invalid_range");

        var invalidDate = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit?from=2026-13-01",
            admin.AccessToken);
        invalidDate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidDate)).Should().Be("invalid_range");

        var invalidResult = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit?result=unknown",
            admin.AccessToken);
        invalidResult.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidResult)).Should().Be("invalid_filter");

        var invalidActor = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/admin/audit?actor=someone@example.test",
            admin.AccessToken);
        invalidActor.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadProblemCodeAsync(invalidActor)).Should().Be("invalid_filter");
    }

    private async Task<AdminUser> CreateAdminAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
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
                $"corr-{token}-alpha",
                AuditActions.Success,
                "{\"emailVerified\":true,\"email\":\"secret@example.test\",\"familyId\":\"family-secret\"}"),
            new(
                AuditActions.Login,
                AuditActions.ActorHuman,
                admin.Id,
                entity2,
                new DateTime(2026, 1, 1, 6, 0, 0, DateTimeKind.Utc),
                $"corr-{token}-beta",
                AuditActions.Failure,
                "{\"reason\":\"invalid_credentials\",\"token\":\"secret-token\"}"),
            new(
                AuditActions.VerifyEmail,
                AuditActions.ActorSystem,
                null,
                entity3,
                new DateTime(2026, 1, 2, 4, 59, 59, DateTimeKind.Utc),
                $"corr-{token}-gamma",
                AuditActions.Success,
                "{\"emailVerified\":true}"),
            new(
                AuditActions.Refresh,
                AuditActions.ActorHuman,
                admin.Id,
                entity1,
                new DateTime(2026, 1, 2, 5, 0, 0, DateTimeKind.Utc),
                $"corr-{token}-delta",
                AuditActions.Success,
                "{\"rotated\":true}"),
            new(
                AuditActions.Logout,
                AuditActions.ActorHuman,
                admin.Id,
                entity1,
                new DateTime(2026, 1, 2, 5, 0, 0, DateTimeKind.Utc),
                $"corr-{token}-epsilon",
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
            result.Add(new SeedRow(publicId, spec.Action, spec.EntityId, spec.CorrelationId));
        }

        await db.SaveChangesAsync(Ct);
        return result;
    }

    private async Task<JsonElement> GetListAsync(string accessToken, string query)
    {
        var response = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit{query}",
            accessToken);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return await ReadJsonAsync(response);
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

    private static string NewScopeType() => $"test_audit_{Guid.NewGuid():N}";

    private sealed record AdminUser(long Id, Guid PublicId, string AccessToken);

    private sealed record SeedRow(
        Guid PublicId,
        string Action,
        string EntityId,
        string CorrelationId);

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
