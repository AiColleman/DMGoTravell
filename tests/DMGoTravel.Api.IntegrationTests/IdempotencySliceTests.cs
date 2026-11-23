using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica la idempotencia durable de creación, cancelación y pago:
/// replay sin duplicar efectos, conflicto de cuerpo, validación de cabecera y concurrencia.
/// </summary>
[Collection("Integration")]
public sealed class IdempotencySliceTests : ApiTestBase
{
    public IdempotencySliceTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Idempotencia: crear con la misma clave y cuerpo reproduce la reserva")]
    public async Task Create_WithSameKeyAndBody_ShouldReplayWithoutDuplicating()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var key = Guid.NewGuid().ToString("N");

        var first = await CreateReservationAsync(user.AccessToken, departureId, 1, idempotencyKey: key);
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        var firstJson = await ReadJsonAsync(first);
        var reservationId = firstJson.GetProperty("id").GetGuid();
        var reservationNumber = firstJson.GetProperty("reservationNumber").GetString();

        var replay = await CreateReservationAsync(user.AccessToken, departureId, 1, idempotencyKey: key);
        replay.StatusCode.Should().Be(HttpStatusCode.Created);
        var replayJson = await ReadJsonAsync(replay);
        replayJson.GetProperty("id").GetGuid().Should().Be(reservationId);
        replayJson.GetProperty("reservationNumber").GetString().Should().Be(reservationNumber);
        replay.Headers.Location.Should().NotBeNull();
        replay.Headers.Location!.ToString().Should().EndWith($"/api/v1/reservations/{reservationId}");

        var list = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/reservations?page=1&pageSize=10",
            user.AccessToken);
        list.StatusCode.Should().Be(HttpStatusCode.OK);
        var listJson = await ReadJsonAsync(list);
        listJson.GetProperty("total").GetInt32().Should().Be(1);

        var cancel = await CancelReservationAsync(
            user.AccessToken,
            reservationId,
            firstJson.GetProperty("version").GetInt64());
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact(DisplayName = "Idempotencia: la misma clave con otro cuerpo devuelve idempotency_conflict")]
    public async Task Create_WithSameKeyDifferentBody_ShouldConflict()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var key = Guid.NewGuid().ToString("N");

        var first = await CreateReservationAsync(user.AccessToken, departureId, 1, idempotencyKey: key);
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        var firstJson = await ReadJsonAsync(first);

        var conflict = await CreateReservationAsync(user.AccessToken, departureId, 2, idempotencyKey: key);
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);
        conflict.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        var conflictJson = await ReadJsonAsync(conflict);
        conflictJson.GetProperty("code").GetString().Should().Be("idempotency_conflict");

        var list = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/reservations?page=1&pageSize=10",
            user.AccessToken);
        var listJson = await ReadJsonAsync(list);
        listJson.GetProperty("total").GetInt32().Should().Be(1);

        var cancel = await CancelReservationAsync(
            user.AccessToken,
            firstJson.GetProperty("id").GetGuid(),
            firstJson.GetProperty("version").GetInt64());
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact(DisplayName = "Idempotencia: la cabecera es obligatoria y tiene longitud máxima")]
    public async Task MissingOrOversizedKey_ShouldReturnValidationFailed()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var withoutKey = CreateBearerRequest(HttpMethod.Post, "/api/v1/reservations", user.AccessToken);
        withoutKey.Content = JsonContent.Create(
            new { departureId, travelers = 1 },
            options: JsonOptions);
        var missing = await Client.SendAsync(withoutKey, Ct);
        missing.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var missingJson = await ReadJsonAsync(missing);
        missingJson.GetProperty("code").GetString().Should().Be("validation_failed");
        missingJson.GetProperty("errors").EnumerateArray()
            .Should().Contain(error => error.GetProperty("field").GetString() == "IdempotencyKey");

        var oversized = await CreateReservationAsync(
            user.AccessToken,
            departureId,
            1,
            idempotencyKey: new string('a', 129));
        oversized.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var oversizedJson = await ReadJsonAsync(oversized);
        oversizedJson.GetProperty("code").GetString().Should().Be("validation_failed");
    }

    [Fact(DisplayName = "Idempotencia: pagar con la misma clave reproduce el pago aprobado")]
    public async Task Payment_WithSameKey_ShouldReplayEvenAfterConfirmation()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var key = Guid.NewGuid().ToString("N");

        var create = await CreateReservationAsync(user.AccessToken, departureId, 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();

        var first = await StartPaymentAsync(user.AccessToken, reservationId, "card", key);
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        var firstJson = await ReadJsonAsync(first);
        var paymentId = firstJson.GetProperty("payment").GetProperty("id").GetGuid();
        firstJson.GetProperty("payment").GetProperty("status").GetString().Should().Be("approved");

        var replay = await StartPaymentAsync(user.AccessToken, reservationId, "card", key);
        replay.StatusCode.Should().Be(HttpStatusCode.Created);
        var replayJson = await ReadJsonAsync(replay);
        replayJson.GetProperty("payment").GetProperty("id").GetGuid().Should().Be(paymentId);
        replayJson.GetProperty("payment").GetProperty("status").GetString().Should().Be("approved");

        var payment = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/payments/{paymentId}",
            user.AccessToken);
        payment.StatusCode.Should().Be(HttpStatusCode.OK);
        var paymentJson = await ReadJsonAsync(payment);
        paymentJson.GetProperty("status").GetString().Should().Be("approved");
    }

    [Fact(DisplayName = "Idempotencia: pagar con la misma clave y otro método devuelve conflicto")]
    public async Task Payment_WithSameKeyDifferentMethod_ShouldConflict()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var key = Guid.NewGuid().ToString("N");

        var create = await CreateReservationAsync(user.AccessToken, departureId, 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();

        var first = await StartPaymentAsync(user.AccessToken, reservationId, "card", key);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var conflict = await StartPaymentAsync(user.AccessToken, reservationId, "yape", key);
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var conflictJson = await ReadJsonAsync(conflict);
        conflictJson.GetProperty("code").GetString().Should().Be("idempotency_conflict");
    }

    [Fact(DisplayName = "Idempotencia: cancelar reproduce la respuesta y detecta otro cuerpo")]
    public async Task Cancel_WithSameKey_ShouldReplayAndConflictOnDifferentBody()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var key = Guid.NewGuid().ToString("N");

        var create = await CreateReservationAsync(user.AccessToken, departureId, 1);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();
        var version = reservation.GetProperty("version").GetInt64();

        var first = await CancelReservationAsync(user.AccessToken, reservationId, version, key);
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var firstJson = await ReadJsonAsync(first);
        firstJson.GetProperty("status").GetString().Should().Be("cancelled");

        var replay = await CancelReservationAsync(user.AccessToken, reservationId, version, key);
        replay.StatusCode.Should().Be(HttpStatusCode.OK);
        var replayJson = await ReadJsonAsync(replay);
        replayJson.GetProperty("status").GetString().Should().Be("cancelled");
        replayJson.GetProperty("version").GetInt64().Should().Be(firstJson.GetProperty("version").GetInt64());

        var conflict = await CancelReservationAsync(
            user.AccessToken,
            reservationId,
            version + 100,
            key);
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var conflictJson = await ReadJsonAsync(conflict);
        conflictJson.GetProperty("code").GetString().Should().Be("idempotency_conflict");
    }

    [Fact(DisplayName = "Idempotencia: dos creaciones concurrentes con la misma clave crean una sola reserva")]
    public async Task ConcurrentCreate_WithSameKey_ShouldCreateOnce()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();
        var key = Guid.NewGuid().ToString("N");

        var first = CreateBearerRequest(HttpMethod.Post, "/api/v1/reservations", user.AccessToken);
        first.Headers.Add("Idempotency-Key", key);
        first.Content = JsonContent.Create(new { departureId, travelers = 1 }, options: JsonOptions);

        var second = CreateBearerRequest(HttpMethod.Post, "/api/v1/reservations", user.AccessToken);
        second.Headers.Add("Idempotency-Key", key);
        second.Content = JsonContent.Create(new { departureId, travelers = 1 }, options: JsonOptions);

        var responses = await Task.WhenAll(
            Client.SendAsync(first, Ct),
            Client.SendAsync(second, Ct));

        responses.Should().OnlyContain(response => response.StatusCode == HttpStatusCode.Created);
        var firstJson = await ReadJsonAsync(responses[0]);
        var secondJson = await ReadJsonAsync(responses[1]);
        var reservationId = firstJson.GetProperty("id").GetGuid();
        secondJson.GetProperty("id").GetGuid().Should().Be(reservationId);

        var list = await SendWithBearerAsync(
            HttpMethod.Get,
            "/api/v1/reservations?page=1&pageSize=10",
            user.AccessToken);
        var listJson = await ReadJsonAsync(list);
        listJson.GetProperty("total").GetInt32().Should().Be(1);

        var cancel = await CancelReservationAsync(
            user.AccessToken,
            reservationId,
            firstJson.GetProperty("version").GetInt64());
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
