using System.Net;
using System.Net.Http.Json;
using System.Text;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Audit.RecoverPendingAudit;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Fase 5 contra PostgreSQL real:
/// - Spec 011: creación de reporte con referencia congelada, indicadores operativos/financieros,
///   filas paginadas sin datos personales, generación/descarga de PDF 1.4 válido y privacidad.
/// - Spec 010 (RF-40-RF-41): encolado persistente de auditoría fallida tras cobro externo y
///   recuperación posterior en audit_record con fecha original preservada.
/// </summary>
[Collection("Integration")]
public sealed class AdminReportsAndAuditRecoveryTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    public AdminReportsAndAuditRecoveryTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Reportes 011: calcula indicadores congelados, pagina filas y genera PDF 1.4 sin datos personales")]
    public async Task Reports_SnapshotIndicatorsPaginationAndPdfWithoutPii_ShouldWork()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (offerId, departureId) = await GetTourAsync();

        // Cliente no tiene acceso a reportes administrativos (011/RF-1)
        var forbiddenReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/reports", user.AccessToken);
        forbiddenReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        forbiddenReq.Content = JsonContent.Create(new { filters = new { from = "2026-01-01", to = "2026-12-31" } }, options: JsonOptions);
        (await Client.SendAsync(forbiddenReq, Ct)).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Creamos una reserva confirmada (pagada) y otra pendiente del mismo tour
        var resPaid = await CreateReservationAsync(user.AccessToken, departureId, travelers: 2);
        resPaid.StatusCode.Should().Be(HttpStatusCode.Created);
        var paidJson = await ReadJsonAsync(resPaid);
        var paidId = paidJson.GetProperty("id").GetGuid();
        var paidNumber = paidJson.GetProperty("reservationNumber").GetString()!;

        (await StartPaymentAsync(user.AccessToken, paidId, "card")).StatusCode.Should().Be(HttpStatusCode.Created);

        var resPending = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        resPending.StatusCode.Should().Be(HttpStatusCode.Created);

        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-5));
        var from = today.AddDays(-1).ToString("yyyy-MM-dd");
        var to = today.AddDays(1).ToString("yyyy-MM-dd");

        // Rango invertido devuelve 400 (011/RF-8)
        var invertedReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/reports", adminToken);
        invertedReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        invertedReq.Content = JsonContent.Create(new { filters = new { from = to, to = from } }, options: JsonOptions);
        (await Client.SendAsync(invertedReq, Ct)).StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Creamos el reporte oficial filtrado por esta oferta
        var createReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/reports", adminToken);
        createReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        createReq.Content = JsonContent.Create(new
        {
            filters = new { from, to, offerId }
        }, options: JsonOptions);
        var created = await Client.SendAsync(createReq, Ct);
        created.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var reportId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        // Una reserva creada DESPUES del reporte NO debe alterar las filas congeladas (DEC-193)
        var laterRes = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        laterRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var laterNumber = (await ReadJsonAsync(laterRes)).GetProperty("reservationNumber").GetString()!;

        // Consultar resumen del reporte
        var detail = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/reports/{reportId}", adminToken);
        detail.StatusCode.Should().Be(HttpStatusCode.OK);
        var detailJson = await ReadJsonAsync(detail);
        detailJson.GetProperty("status").GetString().Should().Be("completed");
        detailJson.GetProperty("pdfStatus").GetString().Should().Be("not_requested");
        var summary = detailJson.GetProperty("summary");
        summary.GetProperty("totalReservations").GetInt32().Should().BeGreaterThanOrEqualTo(2);
        summary.GetProperty("confirmedCount").GetInt32().Should().BeGreaterThanOrEqualTo(1);
        summary.GetProperty("financialMovements").GetArrayLength().Should().BeGreaterThanOrEqualTo(1);

        // Descargar PDF antes de solicitarlo -> 409 report_not_ready
        var notReady = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/reports/{reportId}/pdf", adminToken);
        notReady.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadJsonAsync(notReady)).GetProperty("code").GetString().Should().Be("report_not_ready");

        // Consultar filas paginadas: contiene paidNumber, NO contiene laterNumber ni PII del cliente
        var rowsResp = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/reports/{reportId}/rows?page=1&pageSize=50", adminToken);
        rowsResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var rowsRaw = await rowsResp.Content.ReadAsStringAsync(Ct);
        rowsRaw.Should().Contain(paidNumber);
        rowsRaw.Should().NotContain(laterNumber);
        rowsRaw.Should().NotContain(user.Email);

        // Solicitar y descargar PDF completo
        var pdfReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/reports/{reportId}/pdf", adminToken);
        pdfReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        (await Client.SendAsync(pdfReq, Ct)).StatusCode.Should().Be(HttpStatusCode.Accepted);

        var pdfDownload = await SendWithBearerAsync(HttpMethod.Get, $"/api/v1/admin/reports/{reportId}/pdf", adminToken);
        pdfDownload.StatusCode.Should().Be(HttpStatusCode.OK);
        pdfDownload.Content.Headers.ContentType?.MediaType.Should().Be("application/pdf");
        pdfDownload.Headers.Contains("X-Report-Reference-At").Should().BeTrue();
        pdfDownload.Headers.CacheControl?.NoStore.Should().BeTrue();

        var pdfBytes = await pdfDownload.Content.ReadAsByteArrayAsync(Ct);
        var pdfText = Encoding.ASCII.GetString(pdfBytes);
        pdfText.Should().StartWith("%PDF-1.4");
        pdfText.Should().Contain("%%EOF");
        pdfText.Should().Contain(paidNumber);
        pdfText.Should().NotContain(laterNumber);
        pdfText.Should().NotContain(user.Email); // 011/RF-26: sin datos personales de clientes
    }

    [Fact(DisplayName = "Auditoría 010/RF-40: si falla tras cobro externo, encola y recupera el registro posteriormente")]
    public async Task PendingAuditRecovery_AfterPaymentAuditFailure_ShouldRecoverToAuditLog()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (_, departureId) = await GetTourAsync();

        var created = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var reservationId = (await ReadJsonAsync(created)).GetProperty("id").GetGuid();

        using var failingFactory = Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAuditWriter>();
                services.AddScoped<IAuditWriter>(_ => new FailingPaymentAuditWriter());
            });
        });
        using var failingClient = failingFactory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });

        var payReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/reservations/{reservationId}/payments", user.AccessToken);
        payReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        payReq.Content = JsonContent.Create(new { method = "card" }, options: JsonOptions);

        var payResp = await failingClient.SendAsync(payReq, Ct);
        payResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var paymentId = (await ReadJsonAsync(payResp)).GetProperty("payment").GetProperty("id").GetGuid();

        // Debe existir un registro pendiente en pending_audit_record
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pending = await db.PendingAuditEntries.AsNoTracking()
                .SingleOrDefaultAsync(p => p.EntityId == paymentId.ToString(), Ct);
            pending.Should().NotBeNull();
            pending!.Status.Should().Be(PendingAuditEntry.StatusPending);

            // Ejecutamos el recuperador con el AuditWriter sano del factory principal
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var recovery = await mediator.Send(new RecoverPendingAuditCommand(), Ct);
            recovery.Recovered.Should().BeGreaterThanOrEqualTo(1);

            var after = await db.PendingAuditEntries.AsNoTracking()
                .SingleAsync(p => p.EntityId == paymentId.ToString(), Ct);
            after.Status.Should().Be(PendingAuditEntry.StatusRecovered);
            after.RecoveredAtUtc.Should().NotBeNull();
        }

        // Ahora la auditoría del pago es consultable en /api/v1/admin/audit
        var audit = await SendWithBearerAsync(
            HttpMethod.Get,
            $"/api/v1/admin/audit?type=payment&entity={paymentId}&action={AuditActions.PaymentStart}",
            adminToken);
        audit.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(audit)).GetProperty("total").GetInt32().Should().Be(1);
    }

    private async Task<string> CreateAdminTokenAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(Password), "Administrador reportes"));
            await db.SaveChangesAsync(Ct);
        }

        var login = await Client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email, password = Password },
            JsonOptions,
            Ct);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await ReadJsonAsync(login)).GetProperty("accessToken").GetString()!;
    }

    private sealed class FailingPaymentAuditWriter : IAuditWriter
    {
        public void Record(AuditEntry entry)
        {
            if (entry.Action == AuditActions.PaymentStart)
            {
                throw new InvalidOperationException("Fallo simulado de escritura de auditoría post-cobro.");
            }
        }
    }
}
