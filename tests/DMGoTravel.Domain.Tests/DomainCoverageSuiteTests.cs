using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Exports;
using DMGoTravel.Domain.Modules.Hotels;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Mobility;
using DMGoTravel.Domain.Modules.Notifications;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reports;
using DMGoTravel.Domain.Modules.Reservations;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

/// <summary>
/// Suite integral de invariantes y cobertura de dominio (AC11 — objetivo >= 95% en DMGoTravel.Domain).
/// </summary>
public class DomainCoverageSuiteTests
{
    private static readonly DateTime NowUtc = new(2026, 11, 27, 15, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Money_And_ValueObject_Operators_Equality_And_Guards_Work()
    {
        var a = Money.Create(100.005m); // AwayFromZero -> 100.01
        var b = Money.Create(100.01m);
        var c = Money.Create(250m);

        a.Amount.Should().Be(100.01m);
        a.Currency.Should().Be("PEN");
        a.ToString().Should().Be("100.01");
        (a == b).Should().BeTrue();
        (a != c).Should().BeTrue();
        a.Equals((object?)b).Should().BeTrue();
        a.Equals((ValueObject?)b).Should().BeTrue();
        a.Equals((object?)null).Should().BeFalse();
        a.Equals("100.01").Should().BeFalse();
        a.GetHashCode().Should().Be(b.GetHashCode());
        ValueObject? nullVo = null;
        (nullVo == null).Should().BeTrue();
        (nullVo == a).Should().BeFalse();
        ((ValueObject?)a == null).Should().BeFalse();

        a.CompareTo(null).Should().Be(1);
        (a < c).Should().BeTrue();
        (a <= b).Should().BeTrue();
        (c > a).Should().BeTrue();
        (c >= b).Should().BeTrue();

        (c - a).Amount.Should().Be(149.99m);
        (a * 2).Amount.Should().Be(200.02m);
        Money.Create(200m).ApplyDiscountPercentage(15m).Amount.Should().Be(170m);

        FluentActions.Invoking(() => Money.Create(-1m)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => a.Subtract(c)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => a.Multiply(-2)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => a.ApplyDiscountPercentage(-5m)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => a.ApplyDiscountPercentage(101m)).Should().Throw<DomainException>();

        var exWithInner = new DomainException("msg", new InvalidOperationException("inner"));
        exWithInner.Message.Should().Be("msg");
        exWithInner.InnerException.Should().BeOfType<InvalidOperationException>();
    }

    [Fact]
    public void ExportJob_CreateAudit_CreateClients_IsExpired_And_Guards()
    {
        var adminId = Guid.NewGuid();
        var expires = NowUtc.AddHours(24);

        var audit = ExportJob.CreateAudit(
            adminId, NowUtc, expires, "audit.csv", "col1\nv1", 1, "sha256:abc", "{}");
        audit.Kind.Should().Be(ExportJob.KindAudit);
        audit.Status.Should().Be(ExportJob.StatusCompleted);
        audit.RequestedByPublicId.Should().Be(adminId);
        audit.FileName.Should().Be("audit.csv");
        audit.CsvContent.Should().Be("col1\nv1");
        audit.SnapshotContent.Should().BeNull();
        audit.RowCount.Should().Be(1);
        audit.ContentHash.Should().Be("sha256:abc");
        audit.FiltersJson.Should().Be("{}");
        audit.IsExpired(NowUtc.AddHours(1)).Should().BeFalse();
        audit.IsExpired(expires).Should().BeTrue();

        var clients = ExportJob.CreateClients(
            adminId, NowUtc, expires, "clients.csv", "a,b", "[{\"id\":1}]", 1, "sha256:def", "{}");
        clients.Kind.Should().Be(ExportJob.KindClients);
        clients.SnapshotContent.Should().Be("[{\"id\":1}]");

        FluentActions.Invoking(() => ExportJob.CreateClients(
                adminId, NowUtc, expires, "c.csv", "a", " ", 0, "h", "{}"))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => ExportJob.CreateAudit(
                Guid.Empty, NowUtc, expires, "a.csv", "a", 0, "h", "{}"))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => ExportJob.CreateAudit(
                adminId, NowUtc, NowUtc, "a.csv", "a", 0, "h", "{}"))
            .Should().Throw<ArgumentException>();
        FluentActions.Invoking(() => ExportJob.CreateAudit(
                adminId, NowUtc, expires, "", "a", 0, "h", "{}"))
            .Should().Throw<ArgumentException>();
    }

    [Fact]
    public void MediaAsset_AllFactories_Mutations_And_ValidationGuards()
    {
        var offerImg = MediaAsset.CreateForOffer("k1", "/u1", "IMAGE/JPEG", 1024, "main", 1, 10, false);
        offerImg.OfferId.Should().Be(10);
        offerImg.IsPrimary.Should().BeTrue();
        offerImg.IsPublished.Should().BeFalse();
        offerImg.AssignUrl("/u1-updated");
        offerImg.Url.Should().Be("/u1-updated");

        offerImg.ReplaceContent("k2", "/u2", "image/webp", 2048, isPrimary: false, NowUtc);
        offerImg.Role.Should().Be("gallery");
        offerImg.IsPrimary.Should().BeFalse();
        offerImg.ObjectKey.Should().Be("k2");
        offerImg.FileSizeBytes.Should().Be(2048);

        offerImg.SetRole("main", NowUtc.AddMinutes(1));
        offerImg.IsPrimary.Should().BeTrue();

        offerImg.MarkPublished(NowUtc.AddMinutes(2));
        offerImg.IsPublished.Should().BeTrue();
        var ver = offerImg.RowVersion;
        offerImg.MarkPublished(NowUtc.AddMinutes(3));
        offerImg.RowVersion.Should().Be(ver); // idempotente

        var customId = Guid.NewGuid();
        var hotelImg = MediaAsset.CreateForHotel("kh", "/uh", "image/png", 500, "gallery", 2, 20, true, customId);
        hotelImg.HotelId.Should().Be(20);
        hotelImg.PublicId.Should().Be(customId);

        var roomImg = MediaAsset.CreateForRoomType("kr", "/ur", "image/jpeg", 500, "main", 1, 20, 30, true, customId);
        roomImg.RoomTypeId.Should().Be(30);
        roomImg.HotelId.Should().Be(20);

        var mobImg = MediaAsset.CreateForMobility("km", "/um", "image/webp", 800, 40, true);
        mobImg.MobilityItemId.Should().Be(40);
        mobImg.IsPrimary.Should().BeTrue();

        MediaAsset.IsAllowedContentType("image/gif").Should().BeFalse();
        MediaAsset.IsAllowedContentType("").Should().BeFalse();

        FluentActions.Invoking(() => MediaAsset.CreateForOffer("k", "/u", "image/gif", 100, "main", 1, 1))
            .Should().Throw<DomainException>();
        FluentActions.Invoking(() => MediaAsset.CreateForOffer("k", "/u", "image/png", 0, "main", 1, 1))
            .Should().Throw<DomainException>();
        FluentActions.Invoking(() => MediaAsset.CreateForOffer("k", "/u", "image/png", MediaAsset.MaxImageSizeBytes + 1, "main", 1, 1))
            .Should().Throw<DomainException>();
    }

    [Fact]
    public void Offer_TourDeparture_And_Itinerary_FullLifecycleAndGuards()
    {
        FluentActions.Invoking(() => Offer.Create(OfferType.Tour, "", "desc", 1, DurationUnit.Days, Money.Create(100m), "cond"))
            .Should().Throw<DomainException>();
        FluentActions.Invoking(() => Offer.Create(OfferType.Tour, "n", "", 1, DurationUnit.Days, Money.Create(100m), "cond"))
            .Should().Throw<DomainException>();
        FluentActions.Invoking(() => Offer.Create(OfferType.Tour, "n", "desc", 0, DurationUnit.Days, Money.Create(100m), "cond"))
            .Should().Throw<DomainException>();
        FluentActions.Invoking(() => Offer.Create(OfferType.Tour, "n", "desc", 1, DurationUnit.Days, Money.Zero(), "cond"))
            .Should().Throw<DomainException>();
        FluentActions.Invoking(() => Offer.Create(OfferType.Tour, "n", "desc", 1, DurationUnit.Days, Money.Create(100m), "cond", Money.Create(100m)))
            .Should().Throw<DomainException>();

        var offer = Offer.Create(
            OfferType.Tour, "Tour Huamanga", "Recorrido cultural", 1, DurationUnit.Days,
            Money.Create(150m), "Incluye guía", Money.Create(120m));

        FluentActions.Invoking(() => offer.Activate(NowUtc)).Should().Throw<DomainException>(); // sin itinerario
        var day1 = new OfferItineraryDay(1, "Día 1", "Plaza Mayor y Wari");
        offer.AddItineraryDay(day1);
        FluentActions.Invoking(() => offer.Activate(NowUtc)).Should().Throw<DomainException>(); // sin imagen

        var img = MediaAsset.CreateForOffer("k", "/u", "image/jpeg", 1000, "main", 1, 1, true);
        offer.AddImage(img);
        offer.Activate(NowUtc);
        offer.IsActive.Should().BeTrue();
        offer.Deactivate(NowUtc);
        offer.IsActive.Should().BeFalse();

        offer.Update("Tour Huamanga Plus", "Nueva desc", 2, DurationUnit.Days, Money.Create(200m), "Condiciones", NowUtc);
        offer.Name.Should().Be("Tour Huamanga Plus");
        offer.UpdatePricing(Money.Create(180m), Money.Create(160m), NowUtc);
        offer.ReplaceItinerary([new OfferItineraryDay(1, "Inicio", "Detalle")], NowUtc);
        offer.Itinerary.Should().HaveCount(1);
        offer.RemoveImage(img);
        offer.Images.Should().BeEmpty();

        FluentActions.Invoking(() => offer.Update("", "d", 1, DurationUnit.Days, Money.Create(200m), "c", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.Update("n", "", 1, DurationUnit.Days, Money.Create(200m), "c", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.Update("n", "d", 0, DurationUnit.Days, Money.Create(200m), "c", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.Update("n", "d", 1, DurationUnit.Days, Money.Zero(), "c", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.Update("n", "d", 1, DurationUnit.Days, Money.Create(150m), "c", NowUtc)).Should().Throw<DomainException>(); // <= discounted 160
        FluentActions.Invoking(() => offer.UpdatePricing(Money.Zero(), null, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.UpdatePricing(Money.Create(100m), Money.Zero(), NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.UpdatePricing(Money.Create(100m), Money.Create(100m), NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => offer.ReplaceItinerary([], NowUtc)).Should().Throw<DomainException>();

        FluentActions.Invoking(() => new OfferItineraryDay(0, "t", "d")).Should().Throw<DomainException>();
        FluentActions.Invoking(() => new OfferItineraryDay(1, "", "d")).Should().Throw<DomainException>();
        FluentActions.Invoking(() => new OfferItineraryDay(1, "t", "")).Should().Throw<DomainException>();

        var futureStart = DateTime.UtcNow.AddDays(5);
        var futureEnd = futureStart.AddHours(8);
        var dep = new TourDeparture(1, futureStart, futureEnd, 10, Money.Create(150m), Money.Create(130m));
        offer.AddDeparture(dep);
        offer.Departures.Should().ContainSingle();
        dep.GetEffectivePrice(Money.Create(200m)).Amount.Should().Be(130m);

        dep.HoldSeats(4);
        dep.AvailableCapacity.Should().Be(6);
        dep.ReleaseSeats(2);
        dep.AvailableCapacity.Should().Be(8);

        dep.Update(futureStart, futureEnd, 12, Money.Create(160m), hasActiveReservations: true, NowUtc);
        dep.CapacityTotal.Should().Be(12);
        dep.UpdatePricing(Money.Create(170m), null, NowUtc);
        dep.GetEffectivePrice(Money.Create(200m)).Amount.Should().Be(170m);

        FluentActions.Invoking(() => new TourDeparture(1, DateTime.UtcNow.AddMinutes(-5), futureEnd, 5, Money.Create(100m))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => new TourDeparture(1, futureStart, futureStart, 5, Money.Create(100m))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => new TourDeparture(1, futureStart, futureEnd, 0, Money.Create(100m))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.Update(futureStart, futureStart, 10, Money.Create(160m), false, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.Update(futureStart, futureEnd, 0, Money.Create(160m), false, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.Update(futureStart, futureEnd, 1, Money.Create(160m), false, NowUtc)).Should().Throw<DomainException>(); // < committed 2
        FluentActions.Invoking(() => dep.Update(futureStart, futureEnd, 10, Money.Zero(), false, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.Update(futureStart.AddHours(1), futureEnd.AddHours(1), 10, Money.Create(160m), true, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.UpdatePricing(Money.Zero(), null, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.UpdatePricing(Money.Create(100m), Money.Create(120m), NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.HoldSeats(0)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.HoldSeats(50)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => dep.ReleaseSeats(0)).Should().Throw<DomainException>();
    }

    [Fact]
    public void Hotel_RoomType_LodgingProposal_And_Inventory_FullLifecycleAndGuards()
    {
        FluentActions.Invoking(() => Hotel.Create("", "desc")).Should().Throw<DomainException>();
        FluentActions.Invoking(() => Hotel.Create("H", "")).Should().Throw<DomainException>();

        var hotelId = Guid.NewGuid();
        var hotel = Hotel.Create("Hotel Sumaq", "Casona colonial", hotelId);
        hotel.PublicId.Should().Be(hotelId);
        FluentActions.Invoking(() => hotel.Activate(true, NowUtc)).Should().Throw<DomainException>(); // sin servicios

        hotel.AddService("WiFi fibra");
        FluentActions.Invoking(() => hotel.Activate(false, NowUtc)).Should().Throw<DomainException>(); // sin imagen
        FluentActions.Invoking(() => hotel.Activate(true, NowUtc)).Should().Throw<DomainException>(); // sin habitaciones

        var rtId = Guid.NewGuid();
        var rt = new RoomType(1, "Matrimonial", 2, Money.Create(140m), rtId);
        rt.PublicId.Should().Be(rtId);
        rt.Update("Matrimonial Superior", 3, Money.Create(160m), NowUtc);
        rt.Capacity.Should().Be(3);
        hotel.AddRoomType(rt);

        hotel.Activate(true, NowUtc);
        hotel.IsActive.Should().BeTrue();
        hotel.Update("Hotel Sumaq Plaza", "Centro histórico", ["Desayuno", " ", "WiFi"], NowUtc);
        hotel.Services.Should().HaveCount(2);
        hotel.Deactivate(NowUtc);
        hotel.IsActive.Should().BeFalse();

        rt.Deactivate(NowUtc);
        rt.IsActive.Should().BeFalse();

        FluentActions.Invoking(() => hotel.Update("", "d", [], NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => hotel.Update("n", "", [], NowUtc)).Should().Throw<DomainException>();
        var svc = new HotelService(1, "  WiFi Fibra  ");
        svc.Text.Should().Be("WiFi Fibra");
        FluentActions.Invoking(() => new RoomType(1, "", 2, Money.Create(100m))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => new RoomType(1, "r", 0, Money.Create(100m))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => new RoomType(1, "r", 2, Money.Zero())).Should().Throw<DomainException>();
        FluentActions.Invoking(() => rt.Update("", 2, Money.Create(100m), NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => rt.Update("r", 0, Money.Create(100m), NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => rt.Update("r", 2, Money.Zero(), NowUtc)).Should().Throw<DomainException>();

        var propId = Guid.NewGuid();
        var checkIn = new DateOnly(2026, 12, 10);
        var checkOut = new DateOnly(2026, 12, 12);
        var prop = new LodgingProposal(10, 20, checkIn, checkOut, propId);
        prop.PublicId.Should().Be(propId);
        prop.Nights.Should().Be(2);
        prop.Update(11, 21, checkIn, checkOut.AddDays(1), NowUtc);
        prop.Nights.Should().Be(3);
        prop.Deactivate(NowUtc);
        prop.IsActive.Should().BeFalse();

        FluentActions.Invoking(() => new LodgingProposal(1, 2, checkIn, checkIn)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => prop.Update(1, 2, checkOut, checkIn, NowUtc)).Should().Throw<DomainException>();

        var night = new RoomInventoryNight(1, checkIn, 5);
        night.HoldRoom(2);
        night.AvailableQuantity.Should().Be(3);
        night.ReleaseRoom(1);
        night.AvailableQuantity.Should().Be(4);
        FluentActions.Invoking(() => night.HoldRoom(10)).Should().Throw<DomainException>();
    }

    [Fact]
    public void Payments_ExternalPayment_Webhooks_And_RefundCase_FullLifecycleAndGuards()
    {
        PaymentMethod.All.Should().Contain(PaymentMethod.Card).And.Contain(PaymentMethod.Yape);

        FluentActions.Invoking(() => new PaymentAttempt(1, 2, "bitcoin", Money.Create(100m)))
            .Should().Throw<DomainException>();

        var attempt = new PaymentAttempt(1, 2, PaymentMethod.Yape, Money.Create(240m));
        attempt.Status.Should().Be(PaymentStatus.Created);
        attempt.MarkSent("req_001");
        attempt.Status.Should().Be(PaymentStatus.Sent);
        attempt.ProviderRequestRef.Should().Be("req_001");
        attempt.MarkUnknown();
        attempt.Status.Should().Be(PaymentStatus.Unknown);
        attempt.MarkRejected();
        attempt.Status.Should().Be(PaymentStatus.Rejected);
        attempt.MarkApproved();
        attempt.Status.Should().Be(PaymentStatus.Approved);

        var ext = new ExternalPayment("chg_123", attempt.Id, 1, Money.Create(240m), "approved", NowUtc, "CULQI");
        ext.Provider.Should().Be("culqi");
        ext.ProviderTransactionId.Should().Be("chg_123");
        ext.Amount.Amount.Should().Be(240m);
        FluentActions.Invoking(() => new ExternalPayment("", 1, 1, Money.Create(10m), "approved", NowUtc))
            .Should().Throw<DomainException>();

        var wh = ProcessedWebhookEvent.Create("Culqi", "evt_99", "Charge.Succeeded", NowUtc);
        wh.Provider.Should().Be("culqi");
        wh.ExternalEventId.Should().Be("evt_99");
        wh.EventType.Should().Be("charge.succeeded");
        ProcessedWebhookEvent.Create("resend", "evt_100", "", NowUtc).EventType.Should().Be("unknown");
        FluentActions.Invoking(() => ProcessedWebhookEvent.Create("", "e", "t", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => ProcessedWebhookEvent.Create("culqi", "", "t", NowUtc)).Should().Throw<DomainException>();

        FluentActions.Invoking(() => RefundCase.Open(1, 2, 3, Money.Zero(), "motivo", "culqi", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => RefundCase.Open(1, 2, 3, Money.Create(100m), "", "culqi", NowUtc)).Should().Throw<DomainException>();

        var refund = RefundCase.Open(1, 2, 3, Money.Create(240m), "Cancelación operativa", "", NowUtc);
        refund.Provider.Should().Be("culqi");
        FluentActions.Invoking(() => refund.PrepareRetry(NowUtc)).Should().Throw<DomainException>(); // open no es reintentable
        refund.Authorize(99, NowUtc);
        FluentActions.Invoking(() => refund.Authorize(99, NowUtc)).Should().Throw<DomainException>(); // ya authorized
        refund.MarkUnknown("", NowUtc, "{\"code\":\"timeout\"}");
        refund.Status.Should().Be(RefundCase.StatusUnknown);
        refund.PrepareRetry(NowUtc);
        refund.MarkFailed("", NowUtc, "{\"code\":\"declined\"}");
        refund.Status.Should().Be(RefundCase.StatusFailed);
        refund.PrepareRetry(NowUtc);
        FluentActions.Invoking(() => refund.MarkExecuted("", NowUtc)).Should().Throw<DomainException>();
        refund.MarkExecuted("ref_001", NowUtc, "{\"ok\":true}");
        refund.Status.Should().Be(RefundCase.StatusExecuted);
        var executedVer = refund.RowVersion;
        refund.MarkExecuted("ref_001", NowUtc); // idempotente
        refund.RowVersion.Should().Be(executedVer);
        FluentActions.Invoking(() => refund.MarkFailed("err", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => refund.MarkUnknown("err", NowUtc)).Should().Throw<DomainException>();
    }

    [Fact]
    public void AuditLog_PendingAudit_ReportSnapshot_Notifications_And_Mobility()
    {
        var log = AuditLog.Create("api", "op-1", "human", 5, "reservation.create", "reservation", "res-1", NowUtc, "corr-1", "success", "{}");
        log.Origin.Should().Be("api");
        log.CorrelationId.Should().Be("corr-1");
        log.ChangesJson.Should().Be("{}");

        var pending = PendingAuditEntry.Create("api", "op-2", "human", 5, "payment.start", "payment", "pay-1", NowUtc, "corr-2", "success", "{}", "db error", NowUtc, maxRetries: 2);
        pending.RecordFailure("", NowUtc.AddMinutes(1)).Should().BeFalse();
        pending.RetryCount.Should().Be(1);
        pending.RecordFailure(new string('x', 600), NowUtc.AddMinutes(2)).Should().BeTrue();
        pending.Status.Should().Be(PendingAuditEntry.StatusAlerted);
        pending.MarkRecovered(NowUtc.AddMinutes(6));
        pending.RecoveredAtUtc.Should().NotBeNull();

        var snap = ReportSnapshot.Create(
            Guid.NewGuid(), NowUtc, NowUtc.AddDays(1),
            5, "{}", "{\"ok\":true}", "[]");
        snap.IsExpired(NowUtc.AddDays(2)).Should().BeTrue();
        snap.AttachPdf([1, 2, 3], "reporte.pdf", NowUtc);
        snap.PdfFileName.Should().Be("reporte.pdf");
        FluentActions.Invoking(() => ReportSnapshot.Create(Guid.Empty, NowUtc, NowUtc.AddDays(1), 0, "{}", "{}", "[]")).Should().Throw<DomainException>();
        FluentActions.Invoking(() => ReportSnapshot.Create(Guid.NewGuid(), NowUtc, NowUtc, 0, "{}", "{}", "[]")).Should().Throw<DomainException>();
        FluentActions.Invoking(() => snap.AttachPdf([], "r.pdf", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => snap.AttachPdf([1], "", NowUtc)).Should().Throw<DomainException>();

        var del = NotificationDelivery.Create("reservation.created", "user@example.com", "Asunto", "Cuerpo", NowUtc, "corr-3");
        del.RecipientMasked.Should().Be("us***@example.com");
        NotificationDelivery.MaskEmail("").Should().Be("***");
        NotificationDelivery.MaskEmail("invalido").Should().Be("***");
        NotificationDelivery.MaskEmail("a@b.pe").Should().Be("a***@b.pe");
        del.MarkFailed("timeout", NowUtc, NowUtc.AddMinutes(2));
        del.Status.Should().Be(NotificationDelivery.StatusPending);
        del.MarkFailed("final error", NowUtc, null);
        del.Status.Should().Be(NotificationDelivery.StatusFailed);
        del.MarkSent("resend", "re_msg_1", NowUtc);
        del.MarkDelivered(NowUtc);
        del.Status.Should().Be(NotificationDelivery.StatusDelivered);
        del.MarkBounced("550", NowUtc);
        del.Status.Should().Be(NotificationDelivery.StatusBounced);
        FluentActions.Invoking(() => NotificationDelivery.Create("", "a@b.pe", "s", "b", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => NotificationDelivery.Create("t", "bad", "s", "b", NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => del.MarkSent("resend", "", NowUtc)).Should().Throw<DomainException>();

        var inc = NotificationIncident.Open(1, del.PublicId, NotificationIncident.TypeDeliveryFailed, del.RecipientMasked, "bounce", NowUtc);
        inc.Resolve(99, NowUtc);
        inc.Status.Should().Be(NotificationIncident.StatusResolved);

        FluentActions.Invoking(() => MobilityItem.Create("", "desc", "van", 12, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => MobilityItem.Create("Van", "desc", "van", 0, NowUtc)).Should().Throw<DomainException>();
        var mob = MobilityItem.Create("Sprinter VIP", "", "", 15, NowUtc);
        mob.Type.Should().Be("vehicle");
        FluentActions.Invoking(() => mob.Activate(NowUtc)).Should().Throw<DomainException>(); // sin desc
        mob.Update("Sprinter Ejecutiva", "Aire acondicionado y USB", "minibus", 18, NowUtc);
        FluentActions.Invoking(() => mob.Activate(NowUtc)).Should().Throw<DomainException>(); // sin imagen
        FluentActions.Invoking(() => mob.SetImage("", "image/jpeg", 100, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => mob.SetImage("/img.gif", "image/gif", 100, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => mob.SetImage("/img.jpg", "image/jpeg", MobilityItem.MaxImageSizeBytes + 1, NowUtc)).Should().Throw<DomainException>();
        mob.SetImage("/img.webp", "image/webp", 50_000, NowUtc);
        mob.HasValidImage().Should().BeTrue();
        mob.Activate(NowUtc);
        mob.IsActive.Should().BeTrue();
        mob.Deactivate(NowUtc);
        mob.IsActive.Should().BeFalse();
        FluentActions.Invoking(() => mob.Update("", "d", "van", 10, NowUtc)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => mob.Update("n", "d", "van", 0, NowUtc)).Should().Throw<DomainException>();
    }

    [Fact]
    public void User_Identity_And_Reservation_EdgeCasesAndGuards()
    {
        UserRole.Admin.Should().Be("admin");
        UserRole.Client.Should().Be("client");

        FluentActions.Invoking(() => User.CreateClient("", "hash", "Nombre", null)).Should().Throw<DomainException>();
        FluentActions.Invoking(() => User.CreateClient("a@b.pe", "", "Nombre", null)).Should().Throw<DomainException>();

        var admin = User.CreateAdmin("admin@dmgotravel.com", "hash1", "Admin Principal");
        admin.Role.Should().Be(UserRole.Admin);
        admin.IsEmailVerified.Should().BeTrue();

        var client = User.CreateClient("cliente@viajero.pe", "hash1", "Ana Torres", "+51 999 000 111");
        FluentActions.Invoking(() => client.SetEmailVerificationToken("", NowUtc.AddHours(1))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => client.SetPasswordResetToken("", NowUtc.AddHours(1))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => client.ChangePassword("")).Should().Throw<DomainException>();
        FluentActions.Invoking(() => client.RequestEmailChange("", "h", NowUtc, NowUtc.AddHours(1))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => client.RequestEmailChange("x@y.pe", "", NowUtc, NowUtc.AddHours(1))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => client.ConfirmEmailChange(NowUtc)).Should().Throw<DomainException>();

        client.SetEmailVerificationToken("vh1", NowUtc.AddHours(1));
        client.VerifyEmail();
        client.SetPasswordResetToken("rh1", NowUtc.AddHours(1));
        client.ChangePassword("hash2");
        client.UpdateProfile("Ana María Torres", true, "  +51 988 777 666 ", NowUtc);
        client.Profile!.Phone.Should().Be("+51 988 777 666");
        client.SoftDelete(NowUtc);
        client.Status.Should().Be(UserStatus.Closed);

        var rt = RefreshToken.Create(client, Guid.NewGuid(), "thash", NowUtc, NowUtc.AddDays(7));
        rt.IsUsable(NowUtc).Should().BeTrue();
        rt.Consume("next-hash", NowUtc.AddMinutes(5));
        FluentActions.Invoking(() => rt.Consume("again", NowUtc.AddMinutes(6))).Should().Throw<DomainException>();
        rt.Revoke(NowUtc.AddMinutes(10));
        rt.Revoke(NowUtc.AddMinutes(11)); // idempotente
        rt.IsUsable(NowUtc).Should().BeFalse();
        FluentActions.Invoking(() => RefreshToken.Create(client, Guid.NewGuid(), "", NowUtc, NowUtc.AddDays(1))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => RefreshToken.Create(client, Guid.NewGuid(), "h", NowUtc, NowUtc)).Should().Throw<DomainException>();

        var offerSnap = new ReservationOfferSnapshot("tour", "Tour Wari", NowUtc.AddDays(3), NowUtc.AddDays(3).AddHours(6), 2, Money.Create(120m));
        var lodgSnap = new ReservationLodgingSnapshot(1, "Hotel Sumaq", "Doble", 2, new DateOnly(2026, 11, 30), new DateOnly(2026, 12, 2), Money.Create(150m));
        var tourHold = ReservationHold.CreateForTour(1, 2);
        var hotelHold = ReservationHold.CreateForHotel(2, new DateOnly(2026, 11, 30), 1);

        FluentActions.Invoking(() => Reservation.Create("", 1, 1, 1, offerSnap, null, [tourHold], NowUtc)).Should().Throw<DomainException>();

        var res = Reservation.Create("R-90000001", 1, 1, 1, offerSnap, lodgSnap, [tourHold, hotelHold], NowUtc);
        res.Total.Amount.Should().Be(540m); // 240 + 300
        Reservation.GetApplicableDeadlineType(true).Should().Be("validation_deadline");
        Reservation.GetApplicableDeadlineType(false).Should().Be("payment_deadline");
        res.IsExpiredAt(NowUtc.AddMinutes(16), false).Should().BeTrue();
        res.IsExpiredAt(NowUtc.AddMinutes(16), true).Should().BeFalse();
        res.IsExpiredAt(NowUtc.AddMinutes(21), true).Should().BeTrue();

        res.MarkPaymentStarted(NowUtc.AddMinutes(1));
        FluentActions.Invoking(() => res.ConfirmPayment(NowUtc.AddMinutes(25))).Should().Throw<DomainException>();
        res.ConfirmPayment(NowUtc.AddMinutes(2));
        res.IsExpiredAt(NowUtc.AddHours(1), false).Should().BeFalse();
        FluentActions.Invoking(() => res.ConfirmPayment(NowUtc.AddMinutes(3))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => res.MarkPaymentStarted(NowUtc.AddMinutes(3))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => res.CancelByClient(NowUtc.AddMinutes(3))).Should().Throw<DomainException>();
        res.TryCancelByExpiry(NowUtc.AddMinutes(30)).Should().BeFalse();
        res.TryCancelByPaymentRejection(NowUtc.AddMinutes(3)).Should().BeFalse();

        FluentActions.Invoking(() => res.CompleteByAdmin(NowUtc.AddDays(1))).Should().Throw<DomainException>(); // antes del fin
        FluentActions.Invoking(() => res.CancelByAdmin("", NowUtc.AddDays(1))).Should().Throw<DomainException>();
        FluentActions.Invoking(() => res.CancelByAdmin("motivo", NowUtc.AddDays(4))).Should().Throw<DomainException>(); // ya inició
        res.CompleteByAdmin(NowUtc.AddDays(4));
        res.Status.Should().Be(ReservationStatus.Completed);

        var res2 = Reservation.Create("R-90000002", 1, 1, 1, offerSnap, null, [ReservationHold.CreateForTour(1, 2)], NowUtc);
        res2.CancelByClient(NowUtc.AddMinutes(2));
        res2.CancelByClient(NowUtc.AddMinutes(3)); // idempotente
        res2.Holds.First().Release(NowUtc.AddMinutes(4)); // idempotente

        var res3 = Reservation.Create("R-90000003", 1, 1, 1, offerSnap, null, [ReservationHold.CreateForTour(1, 1)], NowUtc);
        res3.CancelByExpiry(NowUtc.AddMinutes(16));
        res3.CancellationOrigin.Should().Be(CancellationOrigin.Expiry);

        var res4 = Reservation.Create("R-90000004", 1, 1, 1, offerSnap, null, [ReservationHold.CreateForTour(1, 1)], NowUtc);
        res4.TryCancelByPaymentRejection(NowUtc.AddMinutes(17)).Should().BeTrue();
        res4.CancellationOrigin.Should().Be(CancellationOrigin.PaymentReject);
    }
}
