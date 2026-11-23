using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Identity;
using DMGoTravel.Domain.Modules.Reservations;
using FluentAssertions;
using Xunit;

namespace DMGoTravel.Domain.Tests;

public class DomainSliceTests
{
    [Fact(DisplayName = "Money.Copy debe devolver una instancia independiente")]
    public void MoneyCopy_ShouldReturnIndependentInstance()
    {
        var original = Money.Create(120.50m);

        var copy = original.Copy();

        copy.Amount.Should().Be(original.Amount);
        copy.Currency.Should().Be(original.Currency);
        ReferenceEquals(original, copy).Should().BeFalse();
    }

    [Fact(DisplayName = "RefreshToken de un solo uso debe consumirse y revocarse")]
    public void RefreshToken_ConsumeAndRevoke_ShouldWork()
    {
        var user = User.CreateClient(
            "refresh@example.test",
            "hash",
            "Usuario Refresh",
            null);
        var now = DateTime.UtcNow;
        var token = RefreshToken.Create(
            user,
            Guid.NewGuid(),
            "digest",
            now,
            now.AddDays(14));

        token.IsUsable(now).Should().BeTrue();

        token.Consume("replacement-digest", now);
        token.IsUsable(now).Should().BeFalse();
        token.ReplacedByTokenHash.Should().Be("replacement-digest");

        var act = () => token.Consume("other-digest", now);
        act.Should().Throw<DomainException>();

        token.Revoke(now);
        token.RevokedAtUtc.Should().Be(now);
    }

    [Fact(DisplayName = "TourDeparture debe retener y liberar cupos sin exceder la capacidad")]
    public void TourDeparture_HoldAndReleaseSeats_ShouldUpdateCapacity()
    {
        var departure = new TourDeparture(
            1,
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow.AddDays(6),
            10,
            Money.Create(100m));

        departure.HoldSeats(3);
        departure.AvailableCapacity.Should().Be(7);

        departure.ReleaseSeats(2);
        departure.AvailableCapacity.Should().Be(9);

        var act = () => departure.HoldSeats(10);
        act.Should().Throw<DomainException>();
    }

    [Fact(DisplayName = "Reservation.CancelByClient debe ser idempotente y liberar holds")]
    public void Reservation_CancelByClient_ShouldBeIdempotentAndReleaseHolds()
    {
        var now = DateTime.UtcNow;
        var snapshot = new ReservationOfferSnapshot(
            "tour",
            "Tour de prueba",
            now.AddDays(10),
            now.AddDays(11),
            2,
            Money.Create(150m));

        var hold = ReservationHold.CreateForTour(1, 2);
        var reservation = Reservation.Create(
            "R-00000001",
            1,
            1,
            1,
            snapshot,
            null,
            new[] { hold },
            now);

        reservation.CancelByClient(now);

        reservation.Status.Should().Be(ReservationStatus.Cancelled);
        reservation.Holds.Single().State.Should().Be("released");
        reservation.CancelledAtUtc.Should().Be(now);

        var act = () => reservation.CancelByClient(now.AddMinutes(1));
        act.Should().NotThrow();
        reservation.Status.Should().Be(ReservationStatus.Cancelled);
    }

    [Fact(DisplayName = "Offer debe activarse solo con itinerario y datos completos")]
    public void Offer_Activate_ShouldRequireItinerary()
    {
        var offer = Offer.Create(
            OfferType.Tour,
            "Tour de prueba",
            "Descripcion",
            1,
            DurationUnit.Days,
            Money.Create(100m),
            "Condiciones");

        var withoutItinerary = () => offer.Activate();
        withoutItinerary.Should().Throw<DomainException>();

        offer.AddItineraryDay(new OfferItineraryDay(1, "Dia 1", "Actividad"));
        offer.AddImage(MediaAsset.CreateForOffer(
            "key",
            "https://media.example.test/image.jpg",
            "image/jpeg",
            1024,
            "main",
            0,
            0));

        offer.Activate();

        offer.IsActive.Should().BeTrue();
        offer.Images.Should().ContainSingle();
    }
}
