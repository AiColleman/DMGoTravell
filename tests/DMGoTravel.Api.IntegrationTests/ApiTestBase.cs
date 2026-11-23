using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Base compartida por las pruebas de integración y de contrato de la slice.
/// Centraliza el cliente HTTP, la autenticación ficticia y las llamadas principales.
/// </summary>
public abstract class ApiTestBase
{
    protected static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    protected static CancellationToken Ct => TestContext.Current.CancellationToken;

    protected ApiTestBase(ApiFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });
    }

    protected ApiFactory Factory { get; }
    protected HttpClient Client { get; }

    protected async Task<TestUser> RegisterVerifiedUserAsync()
    {
        var email = $"it-{Guid.NewGuid():N}@example.test";
        const string password = "Clave-ficticia-123";

        var register = await Client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email,
                password,
                fullName = "Usuario de integración",
                phone = (string?)null
            },
            JsonOptions,
            Ct);
        register.StatusCode.Should().Be(HttpStatusCode.Created);

        return await VerifyAndLoginAsync(email, password);
    }

    protected async Task<TestUser> VerifyAndLoginAsync(string email, string password)
    {
        var tokenResponse = await Client.GetAsync(
            $"/api/v1/auth/dev/verification-token?email={Uri.EscapeDataString(email)}",
            Ct);
        tokenResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var tokenJson = await ReadJsonAsync(tokenResponse);
        var verificationToken = tokenJson.GetProperty("token").GetString();
        verificationToken.Should().NotBeNullOrWhiteSpace();

        var verify = await Client.PostAsJsonAsync(
            "/api/v1/auth/verify-email",
            new { token = verificationToken },
            JsonOptions,
            Ct);
        verify.StatusCode.Should().Be(HttpStatusCode.OK);

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginJson = await ReadJsonAsync(login);
        var accessToken = loginJson.GetProperty("accessToken").GetString();
        accessToken.Should().NotBeNullOrWhiteSpace();

        return new TestUser(email, password, accessToken!);
    }

    protected async Task<(Guid OfferId, Guid DepartureId)> GetTourAsync()
    {
        return await GetCatalogItemAsync("tours");
    }

    protected async Task<(Guid OfferId, Guid DepartureId)> GetPackageAsync()
    {
        return await GetCatalogItemAsync("packages");
    }

    protected async Task<(Guid OfferId, Guid DepartureId)> GetCatalogItemAsync(string type)
    {
        var list = await Client.GetAsync($"/api/v1/catalog/{type}?page=1&pageSize=10", Ct);
        list.StatusCode.Should().Be(HttpStatusCode.OK);
        var listJson = await ReadJsonAsync(list);
        var items = listJson.GetProperty("items");
        items.GetArrayLength().Should().BeGreaterThan(0);

        var offerId = items[0].GetProperty("id").GetGuid();
        var detail = await Client.GetAsync($"/api/v1/catalog/{type}/{offerId}", Ct);
        detail.StatusCode.Should().Be(HttpStatusCode.OK);
        var detailJson = await ReadJsonAsync(detail);
        var departures = detailJson.GetProperty("departures");
        departures.GetArrayLength().Should().BeGreaterThan(0);

        return (offerId, departures[0].GetProperty("id").GetGuid());
    }

    protected async Task<HttpResponseMessage> CreateReservationAsync(
        string accessToken,
        Guid departureId,
        int travelers,
        object? lodging = null,
        string? idempotencyKey = null)
    {
        var request = CreateBearerRequest(HttpMethod.Post, "/api/v1/reservations", accessToken);
        request.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        request.Content = JsonContent.Create(new { departureId, travelers, lodging }, options: JsonOptions);
        return await Client.SendAsync(request, Ct);
    }

    protected async Task<HttpResponseMessage> StartPaymentAsync(
        string accessToken,
        Guid reservationId,
        string method,
        string? idempotencyKey = null)
    {
        var request = CreateBearerRequest(
            HttpMethod.Post,
            $"/api/v1/reservations/{reservationId}/payments",
            accessToken);
        request.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        request.Content = JsonContent.Create(new { method }, options: JsonOptions);
        return await Client.SendAsync(request, Ct);
    }

    protected async Task<HttpResponseMessage> CancelReservationAsync(
        string accessToken,
        Guid reservationId,
        long version,
        string? idempotencyKey = null)
    {
        var request = CreateBearerRequest(
            HttpMethod.Post,
            $"/api/v1/reservations/{reservationId}/cancel",
            accessToken);
        request.Headers.Add("Idempotency-Key", idempotencyKey ?? Guid.NewGuid().ToString("N"));
        request.Content = JsonContent.Create(new { version }, options: JsonOptions);
        return await Client.SendAsync(request, Ct);
    }

    protected async Task<HttpResponseMessage> SendWithBearerAsync(
        HttpMethod method,
        string path,
        string accessToken)
    {
        return await Client.SendAsync(CreateBearerRequest(method, path, accessToken), Ct);
    }

    protected static HttpRequestMessage CreateBearerRequest(
        HttpMethod method,
        string path,
        string accessToken)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return request;
    }

    protected static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var json = await response.Content.ReadFromJsonAsync<JsonElement>(Ct);
        return json;
    }

    protected static string ExtractCookie(HttpResponseMessage response, string name)
    {
        var setCookies = response.Headers.TryGetValues("Set-Cookie", out var values)
            ? values
            : Enumerable.Empty<string>();

        foreach (var header in setCookies)
        {
            var pair = header.Split(';', 2)[0];
            var separator = pair.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            if (pair[..separator] == name)
            {
                return pair[(separator + 1)..];
            }
        }

        throw new InvalidOperationException($"No se encontró la cookie '{name}'.");
    }

    protected sealed record TestUser(string Email, string Password, string AccessToken);
}
