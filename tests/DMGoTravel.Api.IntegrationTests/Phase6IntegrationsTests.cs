using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Notifications;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Notifications;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Infrastructure.Integrations;
using DMGoTravel.Infrastructure.Persistence;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Verifica Fase 6 contra PostgreSQL real:
/// - Spec 002: devoluciones administrativas (apertura automática al cancelar, listar, detalle, autorizar idempotente,
///   impacto neto en reportes 011) y webhook Culqi firmado con HMAC-SHA256 y deduplicación.
/// - Spec 004: outbox de notificaciones, worker/comando de despacho, webhook Resend firmado con Svix,
///   creación de incidentes con correo enmascarado y reenvío manual administrativo.
/// - Spec 012: validación real de magic bytes y <= 5 MB (415/413), carga/reemplazo/eliminación para
///   ofertas, hoteles, tipos de habitación y movilidad, previsualización privada admin y lectura pública persistente.
/// </summary>
[Collection("Integration")]
public sealed class Phase6IntegrationsTests : ApiTestBase
{
    private const string Password = "Clave-ficticia-123";

    // Magic bytes válidos mínimos para pruebas de contenido real (Spec 012)
    private static readonly byte[] ValidPngBytes =
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52];

    private static readonly byte[] ValidJpegBytes =
        [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9];

    private static readonly byte[] ValidWebpBytes =
        [(byte)'R', (byte)'I', (byte)'F', (byte)'F', 0x24, 0x00, 0x00, 0x00, (byte)'W', (byte)'E', (byte)'B', (byte)'P', (byte)'V', (byte)'P', (byte)'8', (byte)' '];

    public Phase6IntegrationsTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact(DisplayName = "Fase 6 (002): devoluciones administrativas, reporte financiero neto y webhook Culqi firmado/deduplicado")]
    public async Task Refunds_AndCulqiWebhook_ShouldWorkEndToEnd()
    {
        var user = await RegisterVerifiedUserAsync();
        var adminToken = await CreateAdminTokenAsync();
        var (offerId, departureId) = await GetTourAsync();

        // 1. Cliente reserva y paga -> queda confirmada
        var createdRes = await CreateReservationAsync(user.AccessToken, departureId, travelers: 2);
        createdRes.StatusCode.Should().Be(HttpStatusCode.Created);
        var resJson = await ReadJsonAsync(createdRes);
        var reservationId = resJson.GetProperty("id").GetGuid();
        var reservationTotal = resJson.GetProperty("total").GetString()!;

        (await StartPaymentAsync(user.AccessToken, reservationId, "card")).StatusCode.Should().Be(HttpStatusCode.Created);

        // 2. Admin cancela reserva confirmada -> debe abrir RefundCase en estado open
        var cancelReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/reservations/{reservationId}/cancel", adminToken);
        cancelReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        cancelReq.Content = JsonContent.Create(new { reason = "Reprogramación climática" }, options: JsonOptions);
        (await Client.SendAsync(cancelReq, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);

        var listReq = CreateBearerRequest(HttpMethod.Get, "/api/v1/admin/refund-cases?status=open", adminToken);
        var listResp = await Client.SendAsync(listReq, Ct);
        listResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var listJson = await ReadJsonAsync(listResp);
        var refundItem = listJson.GetProperty("items").EnumerateArray()
            .Single(x => x.GetProperty("reservationId").GetGuid() == reservationId);
        var refundId = refundItem.GetProperty("id").GetGuid();
        refundItem.GetProperty("status").GetString().Should().Be("open");
        refundItem.GetProperty("amount").GetString().Should().Be(reservationTotal);

        // 3. Detalle devuelve ETag y autorizar ejecuta devolución con Idempotency-Key + If-Match
        var getReq = CreateBearerRequest(HttpMethod.Get, $"/api/v1/admin/refund-cases/{refundId}", adminToken);
        var getResp = await Client.SendAsync(getReq, Ct);
        getResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var etag = getResp.Headers.ETag!.ToString();

        var authIdemKey = Guid.NewGuid().ToString("N");
        var authReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/refund-cases/{refundId}/authorize", adminToken);
        authReq.Headers.Add("Idempotency-Key", authIdemKey);
        authReq.Headers.TryAddWithoutValidation("If-Match", etag);
        authReq.Content = JsonContent.Create(new { }, options: JsonOptions);
        var authResp = await Client.SendAsync(authReq, Ct);
        authResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var authJson = await ReadJsonAsync(authResp);
        authJson.GetProperty("status").GetString().Should().Be("executed");
        authJson.GetProperty("evidence").GetProperty("providerRefundId").GetString().Should().StartWith("sim_ref_");

        // Reintento idempotente con misma clave devuelve el mismo resultado
        var replayReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/refund-cases/{refundId}/authorize", adminToken);
        replayReq.Headers.Add("Idempotency-Key", authIdemKey);
        replayReq.Headers.TryAddWithoutValidation("If-Match", etag);
        replayReq.Content = JsonContent.Create(new { }, options: JsonOptions);
        var replayResp = await Client.SendAsync(replayReq, Ct);
        replayResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // Re-autorizar ya ejecutado con nueva clave devuelve 409
        var secondAuthReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/refund-cases/{refundId}/authorize", adminToken);
        secondAuthReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        secondAuthReq.Content = JsonContent.Create(new { }, options: JsonOptions);
        (await Client.SendAsync(secondAuthReq, Ct)).StatusCode.Should().Be(HttpStatusCode.Conflict);

        // 4. Reporte Spec 011 refleja el cobro y la devolución ejecutada (diferencia neta = 0.00)
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-5));
        var reportReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/reports", adminToken);
        reportReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        reportReq.Content = JsonContent.Create(new
        {
            filters = new
            {
                from = today.AddDays(-1).ToString("yyyy-MM-dd"),
                to = today.AddDays(1).ToString("yyyy-MM-dd"),
                offerId
            }
        }, options: JsonOptions);
        var reportCreated = await Client.SendAsync(reportReq, Ct);
        reportCreated.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var reportId = (await ReadJsonAsync(reportCreated)).GetProperty("id").GetGuid();

        var reportGet = await Client.SendAsync(CreateBearerRequest(HttpMethod.Get, $"/api/v1/admin/reports/{reportId}", adminToken), Ct);
        var reportJson = await ReadJsonAsync(reportGet);
        var penMovement = reportJson.GetProperty("summary").GetProperty("financialMovements").EnumerateArray()
            .Single(m => m.GetProperty("currency").GetString() == "PEN");
        penMovement.GetProperty("refundCount").GetInt32().Should().BeGreaterThanOrEqualTo(1);
        decimal.Parse(penMovement.GetProperty("executedRefunds").GetString()!, System.Globalization.CultureInfo.InvariantCulture)
            .Should().BeGreaterThanOrEqualTo(decimal.Parse(reservationTotal, System.Globalization.CultureInfo.InvariantCulture));

        // 5. Webhook Culqi: firma inválida -> 401; firma válida confirma intento pendiente; duplicado -> duplicate: true
        var pendingResResp = await CreateReservationAsync(user.AccessToken, departureId, travelers: 1);
        pendingResResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var pendingResId = (await ReadJsonAsync(pendingResResp)).GetProperty("id").GetGuid();
        var providerRef = $"culqi_chg_{Guid.NewGuid():N}";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dbRes = await db.Reservations.SingleAsync(r => r.PublicId == pendingResId, Ct);
            var attempt = new PaymentAttempt(dbRes.Id, dbRes.AccountId, PaymentMethod.Card, dbRes.Total);
            attempt.MarkSent(providerRef);
            db.PaymentAttempts.Add(attempt);
            await db.SaveChangesAsync(Ct);
        }

        var webhookPayload = JsonSerializer.Serialize(new
        {
            id = $"evt_culqi_{Guid.NewGuid():N}",
            type = "payment.succeeded",
            data = new { reference = providerRef, currency = "PEN" }
        });

        // Firma inválida -> 401
        var badWebhook = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/culqi")
        {
            Content = new StringContent(webhookPayload, Encoding.UTF8, "application/json")
        };
        badWebhook.Headers.Add("X-Provider-Signature", "invalid_hex_sig");
        (await Client.SendAsync(badWebhook, Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // Firma HMAC-SHA256 válida -> 200 { received: true, duplicate: false }
        var culqiSecret = Factory.Services.GetRequiredService<IOptions<ExternalProviderOptions>>().Value.CulqiWebhookSecret;
        var validSig = HmacWebhookSignatureVerifier.ComputeHexHmac(culqiSecret, webhookPayload);

        var okWebhook = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/culqi")
        {
            Content = new StringContent(webhookPayload, Encoding.UTF8, "application/json")
        };
        okWebhook.Headers.Add("X-Provider-Signature", validSig);
        var okWebhookResp = await Client.SendAsync(okWebhook, Ct);
        okWebhookResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var okWebhookJson = await ReadJsonAsync(okWebhookResp);
        okWebhookJson.GetProperty("received").GetBoolean().Should().BeTrue();
        okWebhookJson.GetProperty("duplicate").GetBoolean().Should().BeFalse();

        // Confirmó la reserva pendiente
        var getPendingRes = await Client.SendAsync(CreateBearerRequest(HttpMethod.Get, $"/api/v1/reservations/{pendingResId}", user.AccessToken), Ct);
        (await ReadJsonAsync(getPendingRes)).GetProperty("status").GetString().Should().Be("confirmed");

        // Reenvío del mismo evento -> duplicate: true
        var dupWebhook = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/culqi")
        {
            Content = new StringContent(webhookPayload, Encoding.UTF8, "application/json")
        };
        dupWebhook.Headers.Add("X-Provider-Signature", validSig);
        var dupResp = await Client.SendAsync(dupWebhook, Ct);
        dupResp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(dupResp)).GetProperty("duplicate").GetBoolean().Should().BeTrue();
    }

    [Fact(DisplayName = "Fase 6 (004): outbox de notificaciones, webhook Resend Svix, incidentes enmascarados y reenvío manual")]
    public async Task Notifications_OutboxResendWebhookIncidentsAndManualResend_ShouldWork()
    {
        var adminToken = await CreateAdminTokenAsync();
        const string recipientEmail = "bounced.client@example.test";
        Guid deliveryPublicId;
        string providerMessageId;

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var delivery = NotificationDelivery.Create(
                "reservation_confirmed",
                recipientEmail,
                "Confirmación de reserva",
                "Tu reserva ha sido confirmada.",
                DateTime.UtcNow.AddSeconds(-5));
            db.NotificationDeliveries.Add(delivery);
            await db.SaveChangesAsync(Ct);
            deliveryPublicId = delivery.PublicId;

            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var dispatched = await mediator.Send(new DispatchPendingNotificationsCommand(), Ct);
            dispatched.Should().BeGreaterThanOrEqualTo(1);

            var sent = await db.NotificationDeliveries.AsNoTracking().SingleAsync(d => d.PublicId == deliveryPublicId, Ct);
            sent.Status.Should().Be(NotificationDelivery.StatusSent);
            sent.ProviderMessageId.Should().StartWith("sim_email_");
            providerMessageId = sent.ProviderMessageId!;
        }

        var svixId = $"msg_{Guid.NewGuid():N}";
        var svixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var resendPayload = JsonSerializer.Serialize(new
        {
            id = $"evt_resend_{Guid.NewGuid():N}",
            type = "email.bounced",
            data = new
            {
                email_id = providerMessageId,
                bounce = new { message = "550 5.1.1 Mailbox does not exist" }
            }
        });

        // Firma Svix inválida -> 401
        var badResend = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/resend")
        {
            Content = new StringContent(resendPayload, Encoding.UTF8, "application/json")
        };
        badResend.Headers.Add("Svix-Id", svixId);
        badResend.Headers.Add("Svix-Timestamp", svixTimestamp);
        badResend.Headers.Add("Svix-Signature", "v1,invalidbase64==");
        (await Client.SendAsync(badResend, Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // Firma Svix válida -> 200 y crea incidente con destinatario enmascarado
        var resendSecret = Factory.Services.GetRequiredService<IOptions<ExternalProviderOptions>>().Value.ResendWebhookSecret;
        var validSvixSig = HmacWebhookSignatureVerifier.ComputeSvixSignature(resendSecret, svixId, svixTimestamp, resendPayload);

        var okResend = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/resend")
        {
            Content = new StringContent(resendPayload, Encoding.UTF8, "application/json")
        };
        okResend.Headers.Add("Svix-Id", svixId);
        okResend.Headers.Add("Svix-Timestamp", svixTimestamp);
        okResend.Headers.Add("Svix-Signature", validSvixSig);
        var okResendResp = await Client.SendAsync(okResend, Ct);
        okResendResp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(okResendResp)).GetProperty("duplicate").GetBoolean().Should().BeFalse();

        // Duplicado -> duplicate: true
        var dupResend = new HttpRequestMessage(HttpMethod.Post, "/api/v1/webhooks/resend")
        {
            Content = new StringContent(resendPayload, Encoding.UTF8, "application/json")
        };
        dupResend.Headers.Add("Svix-Id", svixId);
        dupResend.Headers.Add("Svix-Timestamp", svixTimestamp);
        dupResend.Headers.Add("Svix-Signature", validSvixSig);
        (await ReadJsonAsync(await Client.SendAsync(dupResend, Ct))).GetProperty("duplicate").GetBoolean().Should().BeTrue();

        // Admin lista incidentes y verifica enmascaramiento (sin correo completo)
        var listIncResp = await Client.SendAsync(
            CreateBearerRequest(HttpMethod.Get, "/api/v1/admin/notification-incidents?status=open", adminToken), Ct);
        listIncResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var incBody = await listIncResp.Content.ReadAsStringAsync(Ct);
        incBody.Should().NotContain(recipientEmail);

        using var incDoc = JsonDocument.Parse(incBody);
        var incident = incDoc.RootElement.GetProperty("items").EnumerateArray()
            .Single(x => x.GetProperty("deliveryId").GetGuid() == deliveryPublicId);
        var incidentId = incident.GetProperty("id").GetGuid();
        incident.GetProperty("recipientMasked").GetString().Should().Be("bo***@example.test");
        incident.GetProperty("type").GetString().Should().Be("bounced");

        // Detalle del incidente
        var getIncResp = await Client.SendAsync(
            CreateBearerRequest(HttpMethod.Get, $"/api/v1/admin/notification-incidents/{incidentId}", adminToken), Ct);
        getIncResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // Reenvío manual -> 202 Accepted y resuelve el incidente abierto
        var resendReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/notification-deliveries/{deliveryPublicId}/resend", adminToken);
        resendReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        resendReq.Content = JsonContent.Create(new { reason = "Cliente confirmó buzón habilitado" }, options: JsonOptions);
        var manualResendResp = await Client.SendAsync(resendReq, Ct);
        manualResendResp.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var resolvedIncResp = await Client.SendAsync(
            CreateBearerRequest(HttpMethod.Get, $"/api/v1/admin/notification-incidents/{incidentId}", adminToken), Ct);
        (await ReadJsonAsync(resolvedIncResp)).GetProperty("status").GetString().Should().Be("resolved");
    }

    [Fact(DisplayName = "Fase 6 (012): carga/reemplazo/borrado multimedia con magic bytes, 413/415 y visibilidad pública/privada")]
    public async Task Media_UploadValidateReplaceDeleteAndServe_ShouldWorkAcrossAllEntities()
    {
        var adminToken = await CreateAdminTokenAsync();

        // 1. Crear oferta inactiva con itinerario
        var createOfferReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/catalog/tours", adminToken);
        createOfferReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        createOfferReq.Content = JsonContent.Create(new
        {
            name = $"Tour Media {Guid.NewGuid():N}",
            description = "Tour para prueba multimedia",
            price = "180.00",
            durationDays = 1,
            conditions = new[] { "Incluye guía" },
            itinerary = new[] { new { day = 1, title = "Día 1", description = "Recorrido completo" } }
        }, options: JsonOptions);
        var offerResp = await Client.SendAsync(createOfferReq, Ct);
        offerResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var offerId = (await ReadJsonAsync(offerResp)).GetProperty("id").GetGuid();

        // 2. Archivo falso (texto haciéndose pasar por image/jpeg) -> 415 UnsupportedMediaType
        using var fakeReq = CreateMultipartImageRequest(
            HttpMethod.Post,
            $"/api/v1/admin/catalog/tours/{offerId}/images",
            adminToken,
            Encoding.UTF8.GetBytes("<html>not a real jpeg</html>"),
            "fake.jpg",
            "image/jpeg",
            true);
        using var fakeResp = await Client.SendAsync(fakeReq, Ct);
        fakeResp.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);

        // 3. Archivo > 5 MB -> 413 PayloadTooLarge
        var oversizedBytes = new byte[5_000_001];
        Array.Copy(ValidPngBytes, oversizedBytes, ValidPngBytes.Length);
        using var bigReq = CreateMultipartImageRequest(
            HttpMethod.Post,
            $"/api/v1/admin/catalog/tours/{offerId}/images",
            adminToken,
            oversizedBytes,
            "huge.png",
            "image/png",
            true);
        using var bigResp = await Client.SendAsync(bigReq, Ct);
        bigResp.StatusCode.Should().Be(HttpStatusCode.RequestEntityTooLarge);

        // 4. Subir PNG válido -> 201 Created (version = 1)
        var uploadOfferReq = CreateMultipartImageRequest(
            HttpMethod.Post,
            $"/api/v1/admin/catalog/tours/{offerId}/images",
            adminToken,
            ValidPngBytes,
            "tour.png",
            "image/png",
            true);
        var uploadOfferResp = await Client.SendAsync(uploadOfferReq, Ct);
        uploadOfferResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var offerAssetJson = await ReadJsonAsync(uploadOfferResp);
        var offerAssetId = offerAssetJson.GetProperty("id").GetGuid();
        offerAssetJson.GetProperty("version").GetInt64().Should().Be(1);
        offerAssetJson.GetProperty("isPrimary").GetBoolean().Should().BeTrue();

        // Antes de activar: público devuelve 404, preview admin devuelve 200 con bytes exactos
        (await Client.GetAsync($"/api/v1/media/{offerAssetId}", Ct)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        var previewResp = await Client.SendAsync(CreateBearerRequest(HttpMethod.Get, $"/api/v1/admin/media/{offerAssetId}", adminToken), Ct);
        previewResp.StatusCode.Should().Be(HttpStatusCode.OK);
        previewResp.Content.Headers.ContentType!.MediaType.Should().Be("image/png");
        (await previewResp.Content.ReadAsByteArrayAsync(Ct)).Should().Equal(ValidPngBytes);

        // Reemplazar imagen por WebP válido -> 200 OK (version = 2)
        var replaceOfferReq = CreateMultipartImageRequest(
            HttpMethod.Put,
            $"/api/v1/admin/catalog/tours/{offerId}/images/{offerAssetId}",
            adminToken,
            ValidWebpBytes,
            "tour.webp",
            "image/webp",
            true);
        var replaceResp = await Client.SendAsync(replaceOfferReq, Ct);
        replaceResp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await ReadJsonAsync(replaceResp)).GetProperty("version").GetInt64().Should().Be(2);

        // Activar oferta vía HTTP (sin seed de BD) -> ahora /api/v1/media/{id} devuelve 200 image/webp
        var activateOfferResp = await Client.SendAsync(
            CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/catalog/tours/{offerId}/activate", adminToken), Ct);
        activateOfferResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var publicMediaResp = await Client.GetAsync($"/api/v1/media/{offerAssetId}", Ct);
        publicMediaResp.StatusCode.Should().Be(HttpStatusCode.OK);
        publicMediaResp.Content.Headers.ContentType!.MediaType.Should().Be("image/webp");
        (await publicMediaResp.Content.ReadAsByteArrayAsync(Ct)).Should().Equal(ValidWebpBytes);

        // Eliminar la última imagen de una oferta activa -> 409 Conflict
        var delLastResp = await Client.SendAsync(
            CreateBearerRequest(HttpMethod.Delete, $"/api/v1/admin/catalog/tours/{offerId}/images/{offerAssetId}", adminToken), Ct);
        delLastResp.StatusCode.Should().Be(HttpStatusCode.Conflict);

        // Desactivar oferta NO borra la marca publicada de la imagen (Spec 012)
        (await Client.SendAsync(
            CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/catalog/tours/{offerId}/deactivate", adminToken), Ct))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await Client.GetAsync($"/api/v1/media/{offerAssetId}", Ct)).StatusCode.Should().Be(HttpStatusCode.OK);

        // 5. Hotel + Tipo de Habitación + Movilidad: carga vía HTTP y activación limpia
        var createHotelReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/hotels", adminToken);
        createHotelReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        createHotelReq.Content = JsonContent.Create(new
        {
            name = $"Hotel Media {Guid.NewGuid():N}",
            description = "Hotel para prueba multimedia",
            services = new[] { "Wi-Fi", "Desayuno" }
        }, options: JsonOptions);
        var hotelId = (await ReadJsonAsync(await Client.SendAsync(createHotelReq, Ct))).GetProperty("id").GetGuid();

        var createRtReq = CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/room-types", adminToken);
        createRtReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        createRtReq.Content = JsonContent.Create(new { name = "Suite Media", capacity = 2, basePrice = "210.00" }, options: JsonOptions);
        var rtId = (await ReadJsonAsync(await Client.SendAsync(createRtReq, Ct))).GetProperty("id").GetGuid();

        (await Client.SendAsync(CreateMultipartImageRequest(
            HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/images", adminToken, ValidJpegBytes, "hotel.jpg", "image/jpeg", true), Ct))
            .StatusCode.Should().Be(HttpStatusCode.Created);

        var rtImgResp = await Client.SendAsync(CreateMultipartImageRequest(
            HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/room-types/{rtId}/images", adminToken, ValidJpegBytes, "room.jpg", "image/jpeg", true), Ct);
        rtImgResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var rtImgId = (await ReadJsonAsync(rtImgResp)).GetProperty("id").GetGuid();

        (await Client.SendAsync(CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/hotels/{hotelId}/activate", adminToken), Ct))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await Client.GetAsync($"/api/v1/media/{rtImgId}", Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Client.SendAsync(CreateBearerRequest(HttpMethod.Delete, $"/api/v1/admin/hotels/{hotelId}/room-types/{rtId}/images/{rtImgId}", adminToken), Ct))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var createMobReq = CreateBearerRequest(HttpMethod.Post, "/api/v1/admin/mobility", adminToken);
        createMobReq.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));
        createMobReq.Content = JsonContent.Create(new
        {
            name = $"Sprinter Media {Guid.NewGuid():N}",
            description = "Van ejecutiva con aire acondicionado",
            type = "van",
            capacity = 14
        }, options: JsonOptions);
        var mobId = (await ReadJsonAsync(await Client.SendAsync(createMobReq, Ct))).GetProperty("id").GetGuid();

        var mobImgResp = await Client.SendAsync(CreateMultipartImageRequest(
            HttpMethod.Put, $"/api/v1/admin/mobility/{mobId}/image", adminToken, ValidJpegBytes, "van.jpg", "image/jpeg", true), Ct);
        mobImgResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var mobAssetId = (await ReadJsonAsync(mobImgResp)).GetProperty("id").GetGuid();

        (await Client.SendAsync(CreateBearerRequest(HttpMethod.Post, $"/api/v1/admin/mobility/{mobId}/activate", adminToken), Ct))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await Client.GetAsync($"/api/v1/media/{mobAssetId}", Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task<string> CreateAdminTokenAsync()
    {
        var email = $"admin-{Guid.NewGuid():N}@example.test";

        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            db.Users.Add(User.CreateAdmin(email, hasher.Hash(Password), "Administrador integraciones"));
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

    private static HttpRequestMessage CreateMultipartImageRequest(
        HttpMethod method,
        string url,
        string token,
        byte[] content,
        string fileName,
        string contentType,
        bool isPrimary)
    {
        var req = CreateBearerRequest(method, url, token);
        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(content);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        form.Add(fileContent, "file", fileName);
        form.Add(new StringContent(isPrimary ? "true" : "false"), "isPrimary");
        req.Content = form;
        return req;
    }
}
