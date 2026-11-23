using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Spec 008 (Perfil y baja lógica de cuenta): actualización acotada de
/// nombre/teléfono, rechazo de campos no autorizados, cambio de correo diferido
/// con cierre de sesiones, y baja lógica bloqueada por reservas activas.
/// </summary>
[Collection("Integration")]
public sealed class ProfileSliceTests : ApiTestBase
{
    public ProfileSliceTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Perfil: actualiza nombre y teléfono, limpia teléfono vacío y rechaza campos no autorizados")]
    public async Task UpdateProfile_ShouldValidateFieldsAndPreserveSession()
    {
        var user = await RegisterVerifiedUserAsync();

        var get = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/profile", user.AccessToken);
        get.StatusCode.Should().Be(HttpStatusCode.OK);
        var etag = get.Headers.ETag?.Tag;
        etag.Should().NotBeNullOrWhiteSpace();

        // Rechaza campos no autorizados (008/RF-3, RF-6)
        var unauthorizedFieldReq = CreateBearerRequest(HttpMethod.Put, "/api/v1/profile", user.AccessToken);
        unauthorizedFieldReq.Content = JsonContent.Create(new { fullName = "Nuevo Nombre", role = "admin" }, options: JsonOptions);
        var unauthorizedField = await Client.SendAsync(unauthorizedFieldReq, Ct);
        unauthorizedField.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await ReadJsonAsync(unauthorizedField);
        problem.GetProperty("code").GetString().Should().Be("validation_failed");

        // Actualiza nombre y teléfono con If-Match válido
        var updateReq = CreateBearerRequest(HttpMethod.Put, "/api/v1/profile", user.AccessToken);
        updateReq.Headers.TryAddWithoutValidation("If-Match", etag!);
        updateReq.Content = JsonContent.Create(new { fullName = "Cliente Actualizado", phone = "+51988888888" }, options: JsonOptions);
        var update = await Client.SendAsync(updateReq, Ct);
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedJson = await ReadJsonAsync(update);
        updatedJson.GetProperty("fullName").GetString().Should().Be("Cliente Actualizado");
        updatedJson.GetProperty("phone").GetString().Should().Be("+51988888888");
        updatedJson.GetProperty("email").GetString().Should().Be(user.Email);

        // If-Match desactualizado devuelve 409 stale_version
        var staleReq = CreateBearerRequest(HttpMethod.Put, "/api/v1/profile", user.AccessToken);
        staleReq.Headers.TryAddWithoutValidation("If-Match", etag!);
        staleReq.Content = JsonContent.Create(new { fullName = "Otro Nombre" }, options: JsonOptions);
        var stale = await Client.SendAsync(staleReq, Ct);
        stale.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(stale)).GetProperty("code").GetString().Should().Be("stale_version");

        // Teléfono vacío limpia el campo opcional sin cerrar sesión (008/RF-5, RF-9)
        var clearPhoneReq = CreateBearerRequest(HttpMethod.Put, "/api/v1/profile", user.AccessToken);
        clearPhoneReq.Content = JsonContent.Create(new { phone = "" }, options: JsonOptions);
        var clearPhone = await Client.SendAsync(clearPhoneReq, Ct);
        clearPhone.StatusCode.Should().Be(HttpStatusCode.OK);
        var clearedJson = await ReadJsonAsync(clearPhone);
        clearedJson.GetProperty("fullName").GetString().Should().Be("Cliente Actualizado");
        clearedJson.GetProperty("phone").ValueKind.Should().Be(System.Text.Json.JsonValueKind.Null);
    }

    [Fact(DisplayName = "Cambio de correo: solo aplica al confirmar, sustituye solicitud anterior y cierra sesiones")]
    public async Task EmailChange_ShouldSupersedeConfirmAndRevokeSessions()
    {
        var user = await RegisterVerifiedUserAsync();
        var firstNewEmail = $"nuevo1-{Guid.NewGuid():N}@example.test";
        var secondNewEmail = $"nuevo2-{Guid.NewGuid():N}@example.test";

        var req1 = CreateBearerRequest(HttpMethod.Post, "/api/v1/profile/email-change", user.AccessToken);
        req1.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        req1.Content = JsonContent.Create(new { newEmail = firstNewEmail, currentPassword = user.Password }, options: JsonOptions);
        var res1 = await Client.SendAsync(req1, Ct);
        res1.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var token1 = await GetEmailChangeTokenAsync(firstNewEmail);

        // Segunda solicitud sustituye la primera (008/RF-13)
        var req2 = CreateBearerRequest(HttpMethod.Post, "/api/v1/profile/email-change", user.AccessToken);
        req2.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        req2.Content = JsonContent.Create(new { newEmail = secondNewEmail, currentPassword = user.Password }, options: JsonOptions);
        var res2 = await Client.SendAsync(req2, Ct);
        res2.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var token2 = await GetEmailChangeTokenAsync(secondNewEmail);

        // Perfil muestra pendiente sin cambiar aún el correo vigente (008/RF-1, RF-12)
        var profileBefore = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/profile", user.AccessToken);
        profileBefore.StatusCode.Should().Be(HttpStatusCode.OK);
        var beforeJson = await ReadJsonAsync(profileBefore);
        beforeJson.GetProperty("email").GetString().Should().Be(user.Email);
        beforeJson.GetProperty("pendingEmailChange").GetProperty("newEmail").GetString().Should().Be(secondNewEmail);

        // Token anterior ya no es válido (008/RF-14)
        var confirmOld = await Client.PostAsJsonAsync(
            "/api/v1/profile/email-change/confirm",
            new { token = token1 },
            JsonOptions,
            Ct);
        confirmOld.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadJsonAsync(confirmOld)).GetProperty("code").GetString().Should().Be("invalid_token");

        // Confirmación válida aplica el nuevo correo y revoca sesiones (008/RF-16, RF-17)
        var confirmNew = await Client.PostAsJsonAsync(
            "/api/v1/profile/email-change/confirm",
            new { token = token2 },
            JsonOptions,
            Ct);
        confirmNew.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(confirmNew)).GetProperty("status").GetString().Should().Be("completed");

        // El token de acceso anterior queda revocado
        var profileAfter = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/profile", user.AccessToken);
        profileAfter.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // El correo anterior ya no autentica (008/RF-18)
        var oldLogin = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password },
            JsonOptions,
            Ct);
        oldLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // El nuevo correo autentica y figura verificado
        var newLogin = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = secondNewEmail, password = user.Password },
            JsonOptions,
            Ct);
        newLogin.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginJson = await ReadJsonAsync(newLogin);
        loginJson.GetProperty("user").GetProperty("email").GetString().Should().Be(secondNewEmail);
        loginJson.GetProperty("user").GetProperty("emailVerified").GetBoolean().Should().BeTrue();
    }

    [Fact(DisplayName = "Baja lógica: bloquea si hay reserva activa, permite tras cancelarla e invalida acceso")]
    public async Task Closure_ShouldBlockOnActiveReservationAndCloseAfterCancellation()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var resJson = await ReadJsonAsync(created);
        var reservationId = resJson.GetProperty("id").GetGuid();
        var reservationNumber = resJson.GetProperty("reservationNumber").GetString()!;
        var version = resJson.GetProperty("version").GetInt64();

        // Con reserva pending, la baja se bloquea informando referencia y estado (008/RF-24, RF-25)
        var blockedReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/profile/closure", user.AccessToken);
        blockedReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        blockedReq.Content = JsonContent.Create(new { confirm = true }, options: JsonOptions);
        var blocked = await Client.SendAsync(blockedReq, Ct);
        blocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var blockedJson = await ReadJsonAsync(blocked);
        blockedJson.GetProperty("code").GetString().Should().Be("account_closure_blocked");
        blockedJson.GetProperty("blockers").EnumerateArray().Should().Contain(b =>
            b.GetProperty("type").GetString() == "reservation" &&
            b.GetProperty("reference").GetString() == reservationNumber &&
            b.GetProperty("status").GetString() == "pending");

        // Cancelamos la reserva manualmente (la baja nunca cancela automáticamente, RF-26)
        var cancel = await CancelReservationAsync(user.AccessToken, reservationId, version);
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);

        // Ahora la baja procede (008/RF-27-RF-29)
        var closeReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/profile/closure", user.AccessToken);
        closeReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        closeReq.Content = JsonContent.Create(new { confirm = true }, options: JsonOptions);
        var closed = await Client.SendAsync(closeReq, Ct);
        closed.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(closed)).GetProperty("status").GetString().Should().Be("closed");

        // El token anterior y el login quedan bloqueados (008/RF-28, RF-32)
        var profileAfter = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/profile", user.AccessToken);
        profileAfter.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var loginAfter = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password },
            JsonOptions,
            Ct);
        loginAfter.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // El correo de una cuenta dada de baja sigue ocupado (008/RF-31)
        var reregister = await Client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new { email = user.Email, password = user.Password, fullName = "Reintento", phone = (string?)null },
            JsonOptions,
            Ct);
        reregister.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact(DisplayName = "Baja lógica: rechaza cerrar cuentas administrativas")]
    public async Task Closure_AdminAccount_ShouldBeForbidden()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";
        const string password = "Clave-ficticia-123";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(password), "Administrador"));
            await db.SaveChangesAsync(Ct);
        }

        var login = await Client.PostAsJsonAsync("/api/v1/auth/login", new { email, password }, JsonOptions, Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var token = (await ReadJsonAsync(login)).GetProperty("accessToken").GetString()!;

        var closeReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/profile/closure", token);
        closeReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        closeReq.Content = JsonContent.Create(new { confirm = true }, options: JsonOptions);
        var response = await Client.SendAsync(closeReq, Ct);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<string> GetEmailChangeTokenAsync(string newEmail)
    {
        var response = await Client.GetAsync(
            $"/api/v1/profile/dev/email-change-token?email={Uri.EscapeDataString(newEmail)}",
            Ct);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ReadJsonAsync(response);
        return json.GetProperty("token").GetString()!;
    }
}
