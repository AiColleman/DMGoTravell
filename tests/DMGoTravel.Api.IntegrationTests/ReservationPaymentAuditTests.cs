using System.Net;
using System.Net.Http.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Reservations;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica la auditoría de reservas y pagos (001/RF-69, 010/RF-9-RF-15, RF-20,
/// RF-25, RF-26, RF-36-RF-39): registro en el mismo commit, sin duplicación en
/// replays, fallo cerrado en operaciones controlables y conservación del cobro
/// real si falla la auditoría tras la respuesta del proveedor externo.
/// </summary>
[Collection("Integration")]
public sealed class ReservationPaymentAuditTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public ReservationPaymentAuditTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Auditoría: reservas y pagos se registran una vez, correlacionados y sin secretos")]
    public async Task ReservationAndPaymentFlow_ShouldAuditOnceWithSafeSummary()
    {
        var user = await RegisterVerifiedUserAsync();
        var admin = await CreateAdminAsync();
        var (_, departureId) = await GetTourAsync();

        var createKey = Guid.NewGuid().ToString("N");
        var create = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1, idempotencyKey: createKey);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservation = await ReadJsonAsync(create);
        var reservationId = reservation.GetProperty("id").GetGuid();
        var reservationNumber = reservation.GetProperty("reservationNumber").GetString()!;

        var createReplay = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1, idempotencyKey: createKey);
        createReplay.StatusCode.Should().Be(HttpStatusCode.Created);

        var payKey = Guid.NewGuid().ToString("N");
        var pay = await StartPaymentAsync(user.AccessToken, reservationId, "card", idempotencyKey: payKey);
        pay.StatusCode.Should().Be(HttpStatusCode.Created);
        var paymentJson = await ReadJsonAsync(pay);
        var paymentId = paymentJson.GetProperty("payment").GetProperty("id").GetGuid();

        var payReplay = await StartPaymentAsync(user.AccessToken, reservationId, "card", idempotencyKey: payKey);
        payReplay.StatusCode.Should().Be(HttpStatusCode.Created);

        var createToCancel = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        createToCancel.StatusCode.Should().Be(HttpStatusCode.Created);
        var pending = await ReadJsonAsync(createToCancel);
        var pendingId = pending.GetProperty("id").GetGuid();
        var pendingVersion = pending.GetProperty("version").GetInt64();

        var cancelKey = Guid.NewGuid().ToString("N");
        var cancel = await CancelReservationAsync(user.AccessToken, pendingId, pendingVersion, idempotencyKey: cancelKey);
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
        var cancelled = await ReadJsonAsync(cancel);
        var cancelledVersion = cancelled.GetProperty("version").GetInt64();

        var cancelReplay = await CancelReservationAsync(user.AccessToken, pendingId, pendingVersion, idempotencyKey: cancelKey);
        cancelReplay.StatusCode.Should().Be(HttpStatusCode.OK);

        var cancelAgain = await CancelReservationAsync(user.AccessToken, pendingId, cancelledVersion);
        cancelAgain.StatusCode.Should().Be(HttpStatusCode.OK);

        var reservationAudit = await GetAdminAuditAsync(
            admin.AccessToken,
            $"?type=reservation&entity={reservationId}");
        reservationAudit.GetProperty("total").GetInt32().Should().Be(1);
        var createEntry = reservationAudit.GetProperty("items")[0];
        createEntry.GetProperty("action").GetString().Should().Be(AuditActions.ReservationCreate);
        createEntry.GetProperty("result").GetString().Should().Be(AuditActions.Success);
        createEntry.GetProperty("correlationId").GetString().Should().NotBeNullOrWhiteSpace();
        createEntry.GetProperty("summary").GetString().Should()
            .Contain("Creación de reserva")
            .And.Contain(reservationNumber)
            .And.Contain("estado pending")
            .And.Contain("viajeros 1")
            .And.Contain("moneda PEN");

        var paymentAudit = await GetAdminAuditAsync(
            admin.AccessToken,
            $"?type=payment&entity={paymentId}");
        paymentAudit.GetProperty("total").GetInt32().Should().Be(1);
        var payEntry = paymentAudit.GetProperty("items")[0];
        payEntry.GetProperty("action").GetString().Should().Be(AuditActions.PaymentStart);
        payEntry.GetProperty("result").GetString().Should().Be(AuditActions.Success);
        payEntry.GetProperty("summary").GetString().Should()
            .Contain("Inicio de pago")
            .And.Contain(reservationId.ToString())
            .And.Contain(reservationNumber)
            .And.Contain("pago approved")
            .And.Contain("estado reserva confirmed")
            .And.Contain("método card")
            .And.Contain("moneda PEN");
        payEntry.GetRawText().Should().NotContain(user.Email).And.NotContain(user.Password);

        var cancelAudit = await GetAdminAuditAsync(
            admin.AccessToken,
            $"?type=reservation&entity={pendingId}&action={AuditActions.ReservationCancel}");
        cancelAudit.GetProperty("total").GetInt32().Should().Be(1);
        var cancelEntry = cancelAudit.GetProperty("items")[0];
        cancelEntry.GetProperty("result").GetString().Should().Be(AuditActions.Success);
        cancelEntry.GetProperty("summary").GetString().Should()
            .Contain("Cancelación de reserva")
            .And.Contain("estado anterior pending")
            .And.Contain("estado cancelled")
            .And.Contain("origen client")
            .And.Contain("cupos liberados 1");
    }

    [Fact(DisplayName = "Auditoría: fallo al auditar creación o cancelación revierte la operación (fail-closed)")]
    public async Task ControllableReservationChanges_WhenAuditFails_ShouldRollbackAndReturnError()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var seatsBeforeCreate = await GetAvailableSeatsAsync(departureId);
        var reservationsBeforeCreate = await CountReservationsAsync();

        using var failingFactory = Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAuditWriter>();
                services.AddScoped<IAuditWriter>(_ => new FailingAuditWriter(AuditActions.ReservationCreate, AuditActions.ReservationCancel));
            });
        });
        using var failingClient = failingFactory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });

        var failedCreateReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/reservations", user.AccessToken);
        failedCreateReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        failedCreateReq.Content = JsonContent.Create(new { departureId, travelers = 1, lodging = (object?)null }, options: JsonOptions);
        var failedCreate = await failingClient.SendAsync(failedCreateReq, Ct);
        failedCreate.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBeforeCreate);
        (await CountReservationsAsync()).Should().Be(reservationsBeforeCreate);

        // Creamos una reserva válida usando el factory normal y probamos fallo al cancelar.
        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdJson = await ReadJsonAsync(created);
        var reservationId = createdJson.GetProperty("id").GetGuid();
        var version = createdJson.GetProperty("version").GetInt64();
        var seatsBeforeCancel = await GetAvailableSeatsAsync(departureId);

        var failedCancelReq = CreateBearerRequest(
            HttpMethod.Post,
            $"/api/v1/reservations/{reservationId}/cancel",
            user.AccessToken);
        failedCancelReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        failedCancelReq.Content = JsonContent.Create(new { version }, options: JsonOptions);
        var failedCancel = await failingClient.SendAsync(failedCancelReq, Ct);
        failedCancel.StatusCode.Should().Be(HttpStatusCode.InternalServerError);

        (await GetAvailableSeatsAsync(departureId)).Should().Be(seatsBeforeCancel);
        (await GetReservationStatusAsync(reservationId)).Should().Be(ReservationStatus.Pending);
    }

    [Fact(DisplayName = "Auditoría: si falla al auditar tras cobro aprobado, se conserva el pago y confirmación")]
    public async Task StartPayment_WhenAuditFailsAfterGatewayApproval_ShouldPreservePaymentResult()
    {
        var user = await RegisterVerifiedUserAsync();
        var (_, departureId) = await GetTourAsync();

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservationId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        using var failingFactory = Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAuditWriter>();
                services.AddScoped<IAuditWriter>(_ => new FailingAuditWriter(AuditActions.PaymentStart));
            });
        });
        using var failingClient = failingFactory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });

        var payReq = CreateBearerRequest(
            HttpMethod.Post,
            $"/api/v1/reservations/{reservationId}/payments",
            user.AccessToken);
        payReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        payReq.Content = JsonContent.Create(new { method = "yape" }, options: JsonOptions);

        var pay = await failingClient.SendAsync(payReq, Ct);
        pay.StatusCode.Should().Be(HttpStatusCode.Created);
        var payJson = await ReadJsonAsync(pay);
        payJson.GetProperty("payment").GetProperty("status").GetString().Should().Be("approved");

        (await GetReservationStatusAsync(reservationId)).Should().Be(ReservationStatus.Confirmed);

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var reservation = await db.Reservations.AsNoTracking()
            .SingleAsync(r => r.PublicId == reservationId, Ct);
        var externalExists = await db.ExternalPayments.AsNoTracking()
            .AnyAsync(e => e.ReservationId == reservation.Id, Ct);
        externalExists.Should().BeTrue();
    }

    private async Task<System.Text.Json.JsonElement> GetAdminAuditAsync(string accessToken, string query)
    {
        var response = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/audit{query}", accessToken);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return await ReadJsonAsync(response);
    }

    private async Task<int> GetAvailableSeatsAsync(Guid departureId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.TourDepartures.AsNoTracking()
            .Where(d => d.PublicId == departureId)
            .Select(d => d.AvailableCapacity)
            .SingleAsync(Ct);
    }

    private async Task<int> CountReservationsAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Reservations.AsNoTracking().CountAsync(Ct);
    }

    private async Task<ReservationStatus> GetReservationStatusAsync(Guid reservationId)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Reservations.AsNoTracking()
            .Where(r => r.PublicId == reservationId)
            .Select(r => r.Status)
            .SingleAsync(Ct);
    }

    private async Task<(Guid PublicId, string AccessToken)> CreateAdminAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            var admin = User.CreateAdmin(email, hasher.Hash(Password), "Administrador auditoría");
            db.Users.Add(admin);
            await db.SaveChangesAsync(Ct);
        }

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password = Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ReadJsonAsync(login);
        return (
            json.GetProperty("user").GetProperty("id").GetGuid(),
            json.GetProperty("accessToken").GetString()!);
    }

    private sealed class FailingAuditWriter : IAuditWriter
    {
        private readonly HashSet<string> _failingActions;

        public FailingAuditWriter(params string[] failingActions)
        {
            _failingActions = new HashSet<string>(failingActions, StringComparer.Ordinal);
        }

        public void Record(AuditEntry entry)
        {
            if (_failingActions.Contains(entry.Action))
            {
                throw new InvalidOperationException($"Fallo simulado de auditoría para {entry.Action}.");
            }
        }
    }
}
