using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica la reemisión del enlace de verificación (005-C) y la recuperación de
/// contraseña (005/RF-22-RF-25): sustitución del enlace, respuesta genérica,
/// uso único y revocación global de sesiones.
/// </summary>
[Collection("Integration")]
public sealed class RecoverySliceTests : ApiTestBase
{
    public RecoverySliceTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Reenvío de verificación: exige autenticación y cabecera de idempotencia")]
    public async Task ResendVerification_ShouldRequireAuthenticationAndIdempotencyKey()
    {
        var anonymous = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/verify-email/resend");
        anonymous.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        var anonymousResponse = await Client.SendAsync(anonymous, Ct);
        anonymousResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        anonymousResponse.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var user = await RegisterUnverifiedUserAsync();
        var withoutKey = CreateBearerRequest(
            HttpMethod.Post,
            "/api/v1/auth/verify-email/resend",
            user.AccessToken);
        var missing = await Client.SendAsync(withoutKey, Ct);
        missing.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var missingJson = await ReadJsonAsync(missing);
        missingJson.GetProperty("code").GetString().Should().Be("validation_failed");
        missingJson.GetProperty("errors").EnumerateArray()
            .Should().Contain(error => error.GetProperty("field").GetString() == "IdempotencyKey");
    }

    [Fact(DisplayName = "Reenvío de verificación: admite, sustituye el enlace anterior y reproduce el replay")]
    public async Task ResendVerification_ShouldSupersedePreviousTokenAndReplay()
    {
        var user = await RegisterUnverifiedUserAsync();
        var key = Guid.NewGuid().ToString("N");

        var firstToken = await GetVerificationTokenAsync(user.Email);
        var first = await ResendVerificationAsync(user.AccessToken, key);
        first.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var firstJson = await ReadJsonAsync(first);
        var firstId = firstJson.GetProperty("id").GetGuid();
        firstJson.GetProperty("status").GetString().Should().Be("accepted");

        var referenceAt = firstJson.GetProperty("referenceAt").GetDateTime();
        var expiresAt = firstJson.GetProperty("expiresAt").GetDateTime();
        (expiresAt - referenceAt).Should().BeCloseTo(TimeSpan.FromHours(24), TimeSpan.FromSeconds(2));

        var secondToken = await GetVerificationTokenAsync(user.Email);
        secondToken.Should().NotBe(firstToken);

        var superseded = await Client.PostAsJsonAsync(
            "/api/v1/auth/verify-email",
            new { token = firstToken },
            JsonOptions,
            Ct);
        superseded.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var supersededJson = await ReadJsonAsync(superseded);
        supersededJson.GetProperty("code").GetString().Should().Be("invalid_token");

        var replay = await ResendVerificationAsync(user.AccessToken, key);
        replay.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var replayJson = await ReadJsonAsync(replay);
        replayJson.GetProperty("id").GetGuid().Should().Be(firstId);
        replayJson.GetProperty("expiresAt").GetDateTime().Should().Be(expiresAt);

        var verify = await Client.PostAsJsonAsync(
            "/api/v1/auth/verify-email",
            new { token = secondToken },
            JsonOptions,
            Ct);
        verify.StatusCode.Should().Be(HttpStatusCode.OK);
        var verifyJson = await ReadJsonAsync(verify);
        verifyJson.GetProperty("status").GetString().Should().Be("verified");
    }

    [Fact(DisplayName = "Reenvío de verificación: una cuenta verificada devuelve already_verified")]
    public async Task ResendVerification_OnVerifiedAccount_ShouldConflict()
    {
        var user = await RegisterVerifiedUserAsync();

        var response = await ResendVerificationAsync(user.AccessToken, Guid.NewGuid().ToString("N"));
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var json = await ReadJsonAsync(response);
        json.GetProperty("code").GetString().Should().Be("already_verified");
    }

    [Fact(DisplayName = "Recuperación: la solicitud responde igual para una cuenta inexistente")]
    public async Task ForgotPassword_UnknownAccount_ShouldRespondGenerically()
    {
        var email = $"unknown-{Guid.NewGuid():N}@example.test";

        var response = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/forgot",
            new { email },
            JsonOptions,
            Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var json = await ReadJsonAsync(response);
        json.GetProperty("status").GetString().Should().Be("accepted");

        var devToken = await Client.GetAsync(
            $"/api/v1/auth/dev/password-reset-token?email={Uri.EscapeDataString(email)}",
            Ct);
        devToken.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact(DisplayName = "Recuperación: restablece la contraseña, usa el enlace una vez y revoca sesiones")]
    public async Task ResetPassword_ShouldChangePasswordRevokeSessionsAndRejectReplay()
    {
        var user = await RegisterVerifiedUserAsync();

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshCookie = ExtractCookie(login, "dmgo_refresh");
        var csrfCookie = ExtractCookie(login, "dmgo_csrf");

        var forgot = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/forgot",
            new { email = user.Email },
            JsonOptions,
            Ct);
        forgot.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var resetToken = await GetPasswordResetTokenAsync(user.Email);
        const string newPassword = "Nueva-Clave-ficticia-456";

        var reset = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/reset",
            new { token = resetToken, newPassword },
            JsonOptions,
            Ct);
        reset.StatusCode.Should().Be(HttpStatusCode.OK);
        var resetJson = await ReadJsonAsync(reset);
        resetJson.GetProperty("status").GetString().Should().Be("completed");

        var replay = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/reset",
            new { token = resetToken, newPassword },
            JsonOptions,
            Ct);
        replay.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var replayJson = await ReadJsonAsync(replay);
        replayJson.GetProperty("code").GetString().Should().Be("invalid_token");

        var oldLogin = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password },
            JsonOptions,
            Ct);
        oldLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var oldLoginJson = await ReadJsonAsync(oldLogin);
        oldLoginJson.GetProperty("code").GetString().Should().Be("invalid_credentials");

        var newLogin = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = newPassword },
            JsonOptions,
            Ct);
        newLogin.StatusCode.Should().Be(HttpStatusCode.OK);

        var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        refreshRequest.Headers.Add("X-CSRF-Token", csrfCookie);
        refreshRequest.Headers.Add("Cookie", $"dmgo_refresh={refreshCookie}; dmgo_csrf={csrfCookie}");
        var refresh = await Client.SendAsync(refreshRequest, Ct);
        refresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact(DisplayName = "Recuperación: prueba inválida o contraseña corta no modifican la contraseña")]
    public async Task ResetPassword_WithInvalidTokenOrWeakPassword_ShouldFail()
    {
        var user = await RegisterVerifiedUserAsync();

        var invalid = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/reset",
            new { token = "token-ficticio-invalido", newPassword = "Nueva-Clave-ficticia-456" },
            JsonOptions,
            Ct);
        invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var invalidJson = await ReadJsonAsync(invalid);
        invalidJson.GetProperty("code").GetString().Should().Be("invalid_token");

        var forgot = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/forgot",
            new { email = user.Email },
            JsonOptions,
            Ct);
        forgot.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var resetToken = await GetPasswordResetTokenAsync(user.Email);

        var weak = await Client.PostAsJsonAsync(
            "/api/v1/auth/password/reset",
            new { token = resetToken, newPassword = "corta" },
            JsonOptions,
            Ct);
        weak.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var weakJson = await ReadJsonAsync(weak);
        weakJson.GetProperty("code").GetString().Should().Be("validation_failed");

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task<TestUser> RegisterUnverifiedUserAsync()
    {
        var email = $"it-{Guid.NewGuid():N}@example.test";
        const string password = "Clave-ficticia-123";

        var response = await Client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new { email, password, fullName = "Usuario de integración", phone = (string?)null },
            JsonOptions,
            Ct);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var json = await ReadJsonAsync(response);
        var accessToken = json.GetProperty("accessToken").GetString();
        accessToken.Should().NotBeNullOrWhiteSpace();

        return new TestUser(email, password, accessToken!);
    }

    private async Task<string> GetVerificationTokenAsync(string email)
    {
        var response = await Client.GetAsync(
            $"/api/v1/auth/dev/verification-token?email={Uri.EscapeDataString(email)}",
            Ct);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ReadJsonAsync(response);
        var token = json.GetProperty("token").GetString();
        token.Should().NotBeNullOrWhiteSpace();
        return token!;
    }

    private async Task<string> GetPasswordResetTokenAsync(string email)
    {
        var response = await Client.GetAsync(
            $"/api/v1/auth/dev/password-reset-token?email={Uri.EscapeDataString(email)}",
            Ct);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ReadJsonAsync(response);
        var token = json.GetProperty("token").GetString();
        token.Should().NotBeNullOrWhiteSpace();
        return token!;
    }

    private async Task<HttpResponseMessage> ResendVerificationAsync(string accessToken, string key)
    {
        var request = CreateBearerRequest(
            HttpMethod.Post,
            "/api/v1/auth/verify-email/resend",
            accessToken);
        request.Headers.Add("Idempotency-Key", key);
        request.Content = JsonContent.Create(new { }, options: JsonOptions);
        return await Client.SendAsync(request, Ct);
    }
}
