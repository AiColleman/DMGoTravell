using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Pruebas de integración de la primera vertical slice contra PostgreSQL real.
/// Cada ejecución recrea la base dmgotravel_it y siembra los datos ficticios.
/// </summary>
[Collection("Integration")]
public sealed class SliceEndToEndTests : ApiTestBase
{
    public SliceEndToEndTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "La API responde salud")]
    public async Task Health_ShouldReturnHealthy()
    {
        var response = await Client.GetAsync("/health", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ReadJsonAsync(response);
        json.GetProperty("status").GetString().Should().Be("Healthy");
    }

    [Fact(DisplayName = "Identidad, catálogo, reserva y pago simulado completan la slice")]
    public async Task Slice_ShouldCompleteEndToEnd()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var profile = await SendWithBearerAsync(HttpMethod.Get, "/api/v1/profile", user.AccessToken);
        profile.StatusCode.Should().Be(HttpStatusCode.OK);

        var create = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();
        reservation.GetProperty("status").GetString().Should().Be("pending");
        reservation.GetProperty("departure").GetProperty("available").GetInt32().Should().BeGreaterThanOrEqualTo(0);

        var pay = await StartPaymentAsync(user.AccessToken, reservationId, "card");
        pay.StatusCode.Should().Be(HttpStatusCode.Created);
        var payment = await ReadJsonAsync(pay);
        payment.GetProperty("payment").GetProperty("status").GetString().Should().Be("approved");
        payment.GetProperty("payment").GetProperty("method").GetString().Should().Be("card");

        var get = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/reservations/{reservationId}",
            user.AccessToken);
        get.StatusCode.Should().Be(HttpStatusCode.OK);
        var confirmed = await ReadJsonAsync(get);
        confirmed.GetProperty("status").GetString().Should().Be("confirmed");

        var cancelConfirmed = await CancelReservationAsync(
            user.AccessToken,
            reservationId,
            confirmed.GetProperty("version").GetInt64());
        cancelConfirmed.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var cancelProblem = await ReadJsonAsync(cancelConfirmed);
        cancelProblem.GetProperty("code").GetString().Should().Be("transition_not_allowed");

        var createPending = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        createPending.StatusCode.Should().Be(HttpStatusCode.Created);
        var pending = await ReadJsonAsync(createPending);
        var pendingId = pending.GetProperty("id").GetGuid();

        var cancel1 = await CancelReservationAsync(
            user.AccessToken,
            pendingId,
            pending.GetProperty("version").GetInt64());
        cancel1.StatusCode.Should().Be(HttpStatusCode.OK);
        var cancelled = await ReadJsonAsync(cancel1);
        cancelled.GetProperty("status").GetString().Should().Be("cancelled");

        var cancel2 = await CancelReservationAsync(
            user.AccessToken,
            pendingId,
            cancelled.GetProperty("version").GetInt64());
        cancel2.StatusCode.Should().Be(HttpStatusCode.OK);
        var cancelledAgain = await ReadJsonAsync(cancel2);
        cancelledAgain.GetProperty("status").GetString().Should().Be("cancelled");
    }

    [Fact(DisplayName = "Las reglas de alcance rechazan paquetes y alojamiento")]
    public async Task ScopeRules_ShouldRejectPackageAndLodging()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, packageDepartureId) = await GetPackageAsync();

        var packageReservation = await CreateReservationAsync(
            user.AccessToken,
            packageDepartureId,
            travelers: 1);
        packageReservation.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var packageProblem = await ReadJsonAsync(packageReservation);
        packageProblem.GetProperty("code").GetString().Should().Be("reservation_unavailable");

        var (_, tourDepartureId) = await GetTourAsync();
        var lodgingReservation = await CreateReservationAsync(
            user.AccessToken,
            tourDepartureId,
            travelers: 1,
            lodging: new { proposalId = Guid.NewGuid(), roomTypeId = Guid.NewGuid() });
        lodgingReservation.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var lodgingProblem = await ReadJsonAsync(lodgingReservation);
        lodgingProblem.GetProperty("code").GetString().Should().Be("validation_failed");
        lodgingProblem.GetProperty("errors").EnumerateArray()
            .Should().Contain(error => error.GetProperty("field").GetString() == "lodging");
    }

    [Fact(DisplayName = "Un perfil sin token devuelve problem+json no autenticado")]
    public async Task ProfileWithoutToken_ShouldReturnProblemDetails()
    {
        var response = await Client.GetAsync("/api/v1/profile", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        var problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().Should().Be("unauthenticated");
    }

    [Fact(DisplayName = "La rotación de refresh invalida el token anterior")]
    public async Task RefreshRotation_ShouldInvalidateOldToken()
    {
        var user = await RegisterVerifiedUserAsync();

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
    }
}
