using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Notifications;
using DMGoTravel.Domain.Modules.Payments;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public class Phase6DomainTests
{
    [Fact(DisplayName = "RefundCase: transiciones open -> authorized -> executed idempotente y control de errores")]
    public void RefundCase_StateMachine_ShouldEnforceTransitions()
    {
        var now = new DateTime(2026, 11, 23, 18, 0, 0, DateTimeKind.Utc);
        var refund = RefundCase.Open(1, 2, 3, Money.Create(250m), "Cancelación operativa", "culqi", now);

        refund.Status.Should().Be(RefundCase.StatusOpen);
        refund.RowVersion.Should().Be(1);

        refund.Authorize(adminId: 99, now.AddMinutes(1));
        refund.Status.Should().Be(RefundCase.StatusAuthorized);
        refund.AuthorizedByAdminId.Should().Be(99);
        refund.RowVersion.Should().Be(2);

        // No permite re-autorizar desde authorized
        var reAuth = () => refund.Authorize(99, now.AddMinutes(2));
        reAuth.Should().Throw<DomainException>();

        // Falla y permite reintento
        refund.MarkFailed("Timeout temporal", now.AddMinutes(3));
        refund.Status.Should().Be(RefundCase.StatusFailed);
        refund.PrepareRetry(now.AddMinutes(4));
        refund.Status.Should().Be(RefundCase.StatusAuthorized);

        // Ejecuta y es idempotente
        refund.MarkExecuted("ref_123", now.AddMinutes(5));
        refund.Status.Should().Be(RefundCase.StatusExecuted);
        refund.ProviderRefundId.Should().Be("ref_123");
        var versionAfterExecute = refund.RowVersion;

        refund.MarkExecuted("ref_123", now.AddMinutes(6));
        refund.RowVersion.Should().Be(versionAfterExecute);

        // No puede fallar tras ejecutada
        var failAfterExec = () => refund.MarkFailed("Error tardío", now.AddMinutes(7));
        failAfterExec.Should().Throw<DomainException>();
    }

    [Fact(DisplayName = "NotificationDelivery e Incident: enmascara destinatario y gestiona ciclo de vida")]
    public void NotificationDelivery_AndIncident_ShouldMaskRecipientAndTrackState()
    {
        var now = new DateTime(2026, 11, 23, 18, 0, 0, DateTimeKind.Utc);
        var delivery = NotificationDelivery.Create(
            "reservation_confirmed",
            "Cliente.Viajero@Example.com",
            "Reserva confirmada",
            "Resumen sin secretos",
            now);

        delivery.RecipientEmail.Should().Be("cliente.viajero@example.com");
        delivery.RecipientMasked.Should().Be("cl***@example.com");
        delivery.Status.Should().Be(NotificationDelivery.StatusPending);

        delivery.MarkSent("resend", "email_001", now.AddSeconds(5));
        delivery.Status.Should().Be(NotificationDelivery.StatusSent);
        delivery.ProviderMessageId.Should().Be("email_001");

        delivery.MarkBounced("Mailbox unavailable", now.AddSeconds(10));
        delivery.Status.Should().Be(NotificationDelivery.StatusBounced);

        var incident = NotificationIncident.Open(
            delivery.Id,
            delivery.PublicId,
            NotificationIncident.TypeBounced,
            delivery.RecipientMasked,
            "Mailbox unavailable",
            now.AddSeconds(10));

        incident.Status.Should().Be(NotificationIncident.StatusOpen);
        incident.RecipientMasked.Should().Be("cl***@example.com");

        incident.Resolve(adminId: 7, now.AddMinutes(2));
        incident.Status.Should().Be(NotificationIncident.StatusResolved);
        incident.ResolvedByAdminId.Should().Be(7);
    }

    [Fact(DisplayName = "MediaAsset: valida tamaño/MIME, reemplazo incrementa versión y publicación persiste")]
    public void MediaAsset_ValidationReplaceAndPublication_ShouldWork()
    {
        var oversized = () => MediaAsset.CreateForOffer("k", "/api/v1/media/1", "image/png", 5_000_001, "main", 1, 10);
        oversized.Should().Throw<DomainException>();

        var badMime = () => MediaAsset.CreateForOffer("k", "/api/v1/media/1", "application/pdf", 1024, "main", 1, 10);
        badMime.Should().Throw<DomainException>();

        var asset = MediaAsset.CreateForOffer("offers/a.png", "/api/v1/media/a", "image/png", 2048, "main", 1, 10, isPublished: false);
        asset.RowVersion.Should().Be(1);
        asset.IsPublished.Should().BeFalse();

        var now = new DateTime(2026, 11, 23, 18, 0, 0, DateTimeKind.Utc);
        asset.ReplaceContent("offers/b.webp", "/api/v1/media/a", "image/webp", 4096, true, now);
        asset.RowVersion.Should().Be(2);
        asset.ContentType.Should().Be("image/webp");

        asset.MarkPublished(now.AddMinutes(1));
        asset.IsPublished.Should().BeTrue();
    }
}
