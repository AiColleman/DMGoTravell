using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica el registro de auditoría de identidad (005/RF-30, 010/RF-9-RF-15):
/// mismo commit que la operación, sin secretos, con resultado, correlación y
/// sin duplicar el éxito de un replay idempotente.
/// </summary>
[Collection("Integration")]
public sealed class AuditSliceTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AuditSliceTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Auditoría: registro, verificación y login se guardan sin secretos")]
    public async Task RegisterVerifyAndLogin_ShouldWriteAuditTrailWithoutSecrets()
    {
        var (accountId, email, accessToken) = await RegisterUnverifiedAsync();

        await VerifyEmailAsync(email);
        await LoginAsync(email, Password);

        var rows = await GetAuditRowsAsync(accountId);

        rows.Should().HaveCount(3);
        rows.Select(row => row.Action).Should().Equal(
            "auth.register",
            "auth.verifyEmail",
            "auth.login");
        rows.Should().OnlyContain(row => row.Result == "success");
        rows.Should().OnlyContain(row => row.ActorType == "human");
        rows.Should().OnlyContain(row => row.Origin == "api");
        rows.Should().OnlyContain(row => row.CorrelationId != null && row.CorrelationId != string.Empty);

        var register = rows.Single(row => row.Action == "auth.register");
        register.ChangesJson.Should().Contain("emailVerified").And.NotContain(email);
        register.ActorId.Should().BeNull();

        var login = rows.Single(row => row.Action == "auth.login");
        login.ChangesJson.Should().Contain("sessionStarted").And.NotContain("refresh");

        accessToken.Should().NotBeNullOrWhiteSpace();

        foreach (var row in rows)
        {
            row.ChangesJson.Should().NotContain(Password);
            row.ChangesJson.Should().NotContain("token");
        }
    }

    [Fact(DisplayName = "Auditoría: reenvío, recuperación y restablecimiento; el replay no duplica el éxito")]
    public async Task RecoveryFlow_ShouldAuditOnceAndNotDuplicateReplay()
    {
        var (accountId, email, accessToken) = await RegisterUnverifiedAsync();
        var key = Guid.NewGuid().ToString("N");

        var resend = await SendWithIdempotencyAsync(
            "/api/v1/auth/verify-email/resend",
            accessToken,
            key);
        resend.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var replay = await SendWithIdempotencyAsync(
            "/api/v1/auth/verify-email/resend",
            accessToken,
            key);
        replay.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var forgot = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/forgot",
            new { email },
            JsonOptions,
            Ct);
        forgot.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var resetToken = await GetResetTokenAsync(email);
        var reset = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/reset",
            new { token = resetToken, newPassword = "Clave-restablecida-456" },
            JsonOptions,
            Ct);
        reset.StatusCode.Should().Be(HttpStatusCode.OK);

        var rows = await GetAuditRowsAsync(accountId);

        rows.Count(row => row.Action == "auth.register").Should().Be(1);
        rows.Count(row => row.Action == "auth.resendVerification").Should().Be(1);
        rows.Count(row => row.Action == "auth.forgotPassword").Should().Be(1);
        rows.Count(row => row.Action == "auth.resetPassword").Should().Be(1);
        rows.Should().OnlyContain(row => row.Result == "success");

        var resendRow = rows.Single(row => row.Action == "auth.resendVerification");
        resendRow.ChangesJson.Should().Contain("supersededPrevious").And.NotContain("token");

        var resetRow = rows.Single(row => row.Action == "auth.resetPassword");
        resetRow.ChangesJson.Should().Contain("passwordChanged");
        resetRow.ChangesJson.Should().Contain("sessionsRevoked");
        resetRow.ChangesJson.Should().NotContain("Clave-restablecida-456");
    }

    [Fact(DisplayName = "Auditoría: login fallido y reutilización de refresh se registran como fallo")]
    public async Task FailedLoginAndRefreshReuse_ShouldAuditFailures()
    {
        var user = await RegisterVerifiedUserAsync();
        var accountId = await GetAccountIdAsync(user.Email);

        var failedLogin = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = "Clave-incorrecta-999" },
            JsonOptions,
            Ct);
        failedLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);

        var oldRefresh = ExtractCookie(login, "dmgo_refresh");
        var csrf = ExtractCookie(login, "dmgo_csrf");

        var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshRequest.Headers.Add("X-CSRF-Token", csrf);
        var refresh = await Client.SendAsync(refreshRequest, Ct);
        refresh.StatusCode.Should().Be(HttpStatusCode.OK);

        using var rawClient = Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = false
        });
        var reuseRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        reuseRequest.Headers.Add("X-CSRF-Token", csrf);
        reuseRequest.Headers.Add("Cookie", $"dmgo_refresh={oldRefresh}; dmgo_csrf={csrf}");
        var reuse = await rawClient.SendAsync(reuseRequest, Ct);
        reuse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var rows = await GetAuditRowsAsync(accountId);

        var failedLoginRow = rows.Single(row =>
            row.Action == "auth.login" && row.Result == "failure");
        failedLoginRow.ChangesJson.Should().Contain("invalid_credentials");
        failedLoginRow.ChangesJson.Should().NotContain("Clave-incorrecta-999");

        var reuseRow = rows.Single(row =>
            row.Action == "auth.refresh" && row.Result == "failure");
        reuseRow.ChangesJson.Should().Contain("reuseDetected");

        rows.Count(row => row.Action == "auth.refresh" && row.Result == "success").Should().Be(1);
        rows.Should().NotContain(row => row.ChangesJson != null && row.ChangesJson.Contains(user.Password));
    }

    private async Task<(Guid AccountId, string Email, string AccessToken)> RegisterUnverifiedAsync()
    {
        var email = $"it-{Guid.NewGuid():N}@example.test";
        var register = await Client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email,
                password = Password,
                fullName = "Usuario de auditoría",
                phone = (string?)null
            },
            JsonOptions,
            Ct);
        register.StatusCode.Should().Be(HttpStatusCode.Created);

        var json = await ReadJsonAsync(register);
        var accountId = json.GetProperty("user").GetProperty("id").GetGuid();
        var accessToken = json.GetProperty("accessToken").GetString();

        return (accountId, email, accessToken!);
    }

    private async Task VerifyEmailAsync(string email)
    {
        var tokenResponse = await Client.GetAsync(
            $"/api/v1/auth/dev/verification-token?email={Uri.EscapeDataString(email)}",
            Ct);
        tokenResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var tokenJson = await ReadJsonAsync(tokenResponse);
        var token = tokenJson.GetProperty("token").GetString();

        var verify = await Client.PostAsJsonAsync(
            "/api/v1/auth/verify-email",
            new { token },
            JsonOptions,
            Ct);
        verify.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task LoginAsync(string email, string password)
    {
        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task<string> GetResetTokenAsync(string email)
    {
        var response = await Client.GetAsync(
            $"/api/v1/auth/dev/password-reset-token?email={Uri.EscapeDataString(email)}",
            Ct);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ReadJsonAsync(response);
        return json.GetProperty("token").GetString()!;
    }

    private async Task<Guid> GetAccountIdAsync(string email)
    {
        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password = Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ReadJsonAsync(login);
        return json.GetProperty("user").GetProperty("id").GetGuid();
    }

    private async Task<HttpResponseMessage> SendWithIdempotencyAsync(
        string path,
        string accessToken,
        string key)
    {
        var request = CreateBearerRequest(HttpMethod.Post, path, accessToken);
        request.Headers.Add("Idempotency-Key", key);
        return await Client.SendAsync(request, Ct);
    }

    private async Task<List<AuditLog>> GetAuditRowsAsync(Guid accountId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var entityId = accountId.ToString();

        return await db.AuditLogs
            .AsNoTracking()
            .Where(row => row.EntityId == entityId)
            .OrderBy(row => row.Id)
            .ToListAsync(Ct);
    }
}
