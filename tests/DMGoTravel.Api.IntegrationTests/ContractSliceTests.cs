using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentAssertions;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Subconjunto ejecutable de CT-02, CT-03, CT-04, CT-06, CT-07 y CT-11
/// sobre las operaciones implementadas en la primera vertical slice.
/// </summary>
[Collection("Integration")]
public sealed class ContractSliceTests : ApiTestBase
{
    public ContractSliceTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "CT-02: catálogo anónimo y endpoints protegidos")]
    public async Task CT02_Security_ShouldMatchDeclaredRequirements()
    {
        var catalog = await Client.GetAsync("/api/v1/catalog/tours?page=1&pageSize=10", Ct);
        catalog.StatusCode.Should().Be(HttpStatusCode.OK);

        foreach (var path in new[]
                 {
                     "/api/v1/profile",
                     "/api/v1/reservations",
                     $"/api/v1/reservations/{Guid.NewGuid()}"
                 })
        {
            var response = await Client.GetAsync(path, Ct);
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized, path);
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json", path);
            var problem = await ReadJsonAsync(response);
            problem.GetProperty("code").GetString().Should().Be("unauthenticated", path);
        }

        var createWithoutToken = await Client.PostAsJsonAsync(
            "/api/v1/reservations",
            new { departureId = Guid.NewGuid(), travelers = 1 },
            JsonOptions,
            Ct);
        createWithoutToken.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact(DisplayName = "CT-02/CT-11: un cliente no accede a la reserva de otro")]
    public async Task CT02_ClientIsolation_ShouldReturnNotFound()
    {
        var owner = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var create = await CreateReservationAsync(owner.AccessToken, departureId, travelers: 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);

        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();
        var version = reservation.GetProperty("version").GetInt64();

        var other = await RegisterVerifiedUserAsync();

        var get = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/reservations/{reservationId}",
            other.AccessToken);
        get.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var getProblem = await ReadJsonAsync(get);
        getProblem.GetProperty("code").GetString().Should().Be("not_found");

        var cancel = await CancelReservationAsync(other.AccessToken, reservationId, version);
        cancel.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var pay = await StartPaymentAsync(other.AccessToken, reservationId, "card");
        pay.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var ownerCancel = await CancelReservationAsync(owner.AccessToken, reservationId, version);
        ownerCancel.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact(DisplayName = "CT-03: las creaciones devuelven Location")]
    public async Task CT03_CreatedResponses_ShouldIncludeLocation()
    {
        var email = $"ct03-{Guid.NewGuid():N}@example.test";
        const string password = "Clave-ficticia-123";

        var register = await Client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new { email, password, fullName = "Usuario CT03", phone = (string?)null },
            JsonOptions,
            Ct);
        register.StatusCode.Should().Be(HttpStatusCode.Created);
        register.Headers.Location.Should().NotBeNull();
        register.Headers.Location!.ToString().Should().EndWith("/api/v1/profile");

        var user = await VerifyAndLoginAsync(email, password);
        var (_, departureId) = await GetTourAsync();

        var create = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();
        create.Headers.Location.Should().NotBeNull();
        create.Headers.Location!.ToString().Should().EndWith($"/api/v1/reservations/{reservationId}");

        var pay = await StartPaymentAsync(user.AccessToken, reservationId, "card");
        pay.StatusCode.Should().Be(HttpStatusCode.Created);
        var payment = await ReadJsonAsync(pay);
        var paymentId = payment.GetProperty("payment").GetProperty("id").GetGuid();
        pay.Headers.Location.Should().NotBeNull();
        pay.Headers.Location!.ToString().Should().EndWith($"/api/v1/payments/{paymentId}");
    }

    [Fact(DisplayName = "CT-04: problem+json mantiene la forma uniforme")]
    public async Task CT04_ProblemDetails_ShouldHaveUniformShape()
    {
        var invalidRegister = await Client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new { email = "no-es-correo", password = "corta", fullName = "", phone = (string?)null },
            JsonOptions,
            Ct);
        invalidRegister.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        invalidRegister.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var validation = await ReadJsonAsync(invalidRegister);
        validation.GetProperty("type").GetString().Should().StartWith("https://dmgotravel.com/errors/");
        validation.GetProperty("title").GetString().Should().NotBeNullOrWhiteSpace();
        validation.GetProperty("status").GetInt32().Should().Be(400);
        validation.GetProperty("code").GetString().Should().Be("validation_failed");
        validation.GetProperty("traceId").GetString().Should().NotBeNullOrWhiteSpace();

        var errors = validation.GetProperty("errors");
        errors.GetArrayLength().Should().BeGreaterThan(0);
        errors[0].GetProperty("field").GetString().Should().NotBeNullOrWhiteSpace();
        errors[0].GetProperty("message").GetString().Should().NotBeNullOrWhiteSpace();

        var user = await RegisterVerifiedUserAsync();
        var missing = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/reservations/{Guid.NewGuid()}",
            user.AccessToken);
        missing.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var missingProblem = await ReadJsonAsync(missing);
        missingProblem.GetProperty("code").GetString().Should().Be("not_found");
        missingProblem.GetProperty("status").GetInt32().Should().Be(404);

        var (_, packageDepartureId) = await GetPackageAsync();
        var package = await CreateReservationAsync(user.AccessToken, packageDepartureId, travelers: 1);
        package.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var packageProblem = await ReadJsonAsync(package);
        packageProblem.GetProperty("code").GetString().Should().Be("reservation_unavailable");
        packageProblem.GetProperty("status").GetInt32().Should().Be(409);
    }

    [Fact(DisplayName = "CT-06: una versión obsoleta devuelve stale_version")]
    public async Task CT06_StaleVersion_ShouldReturnConflict()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var create = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();
        var version = reservation.GetProperty("version").GetInt64();

        var stale = await CancelReservationAsync(user.AccessToken, reservationId, version + 100);
        stale.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var staleProblem = await ReadJsonAsync(stale);
        staleProblem.GetProperty("code").GetString().Should().Be("stale_version");

        var cancel = await CancelReservationAsync(user.AccessToken, reservationId, version);
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
        var cancelled = await ReadJsonAsync(cancel);
        cancelled.GetProperty("status").GetString().Should().Be("cancelled");
        cancelled.GetProperty("version").GetInt64().Should().BeGreaterThan(version);
    }

    [Fact(DisplayName = "CT-07: paginación 1-based, página vacía y dinero decimal")]
    public async Task CT07_PaginationAndMoney_ShouldMatchContract()
    {
        foreach (var invalidPage in new[] { "0", "-1", "abc" })
        {
            var invalid = await Client.GetAsync(
                $"/api/v1/catalog/tours?page={invalidPage}&pageSize=10",
                Ct);
            invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest, invalidPage);
            var invalidProblem = await ReadJsonAsync(invalid);
            invalidProblem.GetProperty("code").GetString().Should().Be("invalid_page", invalidPage);
        }

        var emptyPage = await Client.GetAsync("/api/v1/catalog/tours?page=999&pageSize=10", Ct);
        emptyPage.StatusCode.Should().Be(HttpStatusCode.OK);
        var emptyPageJson = await ReadJsonAsync(emptyPage);
        emptyPageJson.GetProperty("items").GetArrayLength().Should().Be(0);
        emptyPageJson.GetProperty("hasNext").GetBoolean().Should().BeFalse();
        emptyPageJson.GetProperty("total").GetInt32().Should().BeGreaterThanOrEqualTo(0);

        var user = await RegisterVerifiedUserAsync();
        var invalidReservations = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/reservations?page=0&pageSize=10",
            user.AccessToken);
        invalidReservations.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var invalidReservationsProblem = await ReadJsonAsync(invalidReservations);
        invalidReservationsProblem.GetProperty("code").GetString().Should().Be("invalid_page");

        var catalog = await Client.GetAsync("/api/v1/catalog/tours?page=1&pageSize=10", Ct);
        var catalogJson = await ReadJsonAsync(catalog);
        var item = catalogJson.GetProperty("items")[0];
        item.GetProperty("price").GetString().Should().MatchRegex(@"^\d+\.\d{2}$");
        item.GetProperty("currency").GetString().Should().Be("PEN");

        var (_, departureId) = await GetTourAsync();
        var create = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        reservation.GetProperty("total").GetString().Should().MatchRegex(@"^\d+\.\d{2}$");
        reservation.GetProperty("currency").GetString().Should().Be("PEN");

        var reservationId = reservation.GetProperty("id").GetGuid();
        var pay = await StartPaymentAsync(user.AccessToken, reservationId, "card");
        pay.StatusCode.Should().Be(HttpStatusCode.Created);
        var payment = await ReadJsonAsync(pay);
        payment.GetProperty("payment").GetProperty("amount").GetString()
            .Should().MatchRegex(@"^\d+\.\d{2}$");
        payment.GetProperty("payment").GetProperty("currency").GetString().Should().Be("PEN");
    }

    [Fact(DisplayName = "CT-11: los errores no filtran detalles internos")]
    public async Task CT11_ErrorBodies_ShouldNotLeakInternals()
    {
        var user = await RegisterVerifiedUserAsync();
        var missing = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/reservations/{Guid.NewGuid()}",
            user.AccessToken);
        missing.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var body = await missing.Content.ReadAsStringAsync(Ct);
        body.Should().NotContain("Exception");
        body.Should().NotContain("Npgsql");
        body.Should().NotContain("SQL");
        body.Should().NotContain("stack");
        body.Should().NotContain("password");
        body.Should().NotContain(user.AccessToken);
    }
}
