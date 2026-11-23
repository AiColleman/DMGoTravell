using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Mobility;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public sealed class CatalogMobilityDomainTests
{
    [Fact(DisplayName = "Movilidad: nace inactiva, exige imagen válida <= 5MB para activar y desactiva sin borrar")]
    public void MobilityItem_LifecycleAndValidation_ShouldWork()
    {
        var now = new DateTime(2026, 11, 23, 16, 0, 0, DateTimeKind.Utc);
        var item = MobilityItem.Create("Van Turística", "Aire acondicionado y Wi-Fi", "van", 12, now);
        item.IsActive.Should().BeFalse();

        // Sin imagen no puede activarse (013/RF-19)
        var activateNoImg = () => item.Activate(now);
        activateNoImg.Should().Throw<DomainException>();

        // Formato o tamaño inválido rechazado (013/RF-22, RF-23)
        var badMime = () => item.SetImage("https://media.example.test/v.gif", "image/gif", 1024, now);
        badMime.Should().Throw<DomainException>();
        var tooLarge = () => item.SetImage("https://media.example.test/v.jpg", "image/jpeg", 5_000_001, now);
        tooLarge.Should().Throw<DomainException>();

        item.SetImage("https://media.example.test/van.webp", "image/webp", 250_000, now);
        item.Activate(now);
        item.IsActive.Should().BeTrue();

        item.Deactivate(now.AddMinutes(1));
        item.IsActive.Should().BeFalse();
    }

    [Fact(DisplayName = "Catálogo: precios con descuento deben ser menores al normal y salidas protegen horario con reservas")]
    public void OfferAndDeparture_PricingAndProtectionRules_ShouldWork()
    {
        var now = new DateTime(2026, 11, 23, 16, 0, 0, DateTimeKind.Utc);
        var offer = Offer.Create(
            OfferType.Tour,
            "Tour Paracas",
            "Recorrido marino",
            1,
            DurationUnit.Days,
            Money.Create(150m),
            "Sujeto al clima");

        var invalidDiscount = () => offer.UpdatePricing(Money.Create(150m), Money.Create(150m), now);
        invalidDiscount.Should().Throw<DomainException>();

        offer.UpdatePricing(Money.Create(150m), Money.Create(120m), now);
        offer.PriceDiscounted!.Amount.Should().Be(120m);

        var start = DateTime.UtcNow.AddDays(10);
        var end = start.AddHours(8);
        var departure = new TourDeparture(1, start, end, 10, Money.Create(150m));
        departure.HoldSeats(3);

        // No permite reducir capacidad debajo de cupos comprometidos
        var reduceTooMuch = () => departure.Update(start, end, 2, Money.Create(150m), hasActiveReservations: true, now);
        reduceTooMuch.Should().Throw<DomainException>();

        // No permite cambiar horario con reservas activas
        var reschedule = () => departure.Update(start.AddHours(1), end.AddHours(1), 10, Money.Create(150m), hasActiveReservations: true, now);
        reschedule.Should().Throw<DomainException>();

        // Aumentar capacidad conservando horario sí está permitido
        departure.Update(start, end, 15, Money.Create(160m), hasActiveReservations: true, now);
        departure.CapacityTotal.Should().Be(15);
        departure.AvailableCapacity.Should().Be(12);
    }
}
