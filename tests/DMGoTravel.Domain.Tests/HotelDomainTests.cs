using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Hotels;
using DMGoTravel.Domain.Modules.Reservations;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public sealed class HotelDomainTests
{
    [Fact(DisplayName = "Hotel 007: nace inactivo y exige servicio, habitación activa e imagen para activarse")]
    public void Hotel_Activate_ShouldEnforceCompleteness()
    {
        var now = new DateTime(2026, 11, 23, 16, 30, 0, DateTimeKind.Utc);
        var hotel = Hotel.Create("Hotel Mirador", "Vista panorámica del valle");
        hotel.IsActive.Should().BeFalse();

        var noServices = () => hotel.Activate(hasImage: true, now);
        noServices.Should().Throw<DomainException>();

        hotel.AddService("Wi-Fi");
        var noRooms = () => hotel.Activate(hasImage: true, now);
        noRooms.Should().Throw<DomainException>();

        hotel.AddRoomType(new RoomType(1, "Doble", 2, Money.Create(180m)));
        var noImage = () => hotel.Activate(hasImage: false, now);
        noImage.Should().Throw<DomainException>();

        hotel.Activate(hasImage: true, now);
        hotel.IsActive.Should().BeTrue();
    }

    [Fact(DisplayName = "Inventario hotelero 007: protege habitaciones comprometidas y calcula subtotal por noches")]
    public void RoomInventoryAndSnapshot_ShouldEnforceCommittedFloorAndNightlyRate()
    {
        var night = new RoomInventoryNight(10, new DateOnly(2026, 12, 15), 2);
        night.HoldRoom(1);
        night.AvailableQuantity.Should().Be(1);

        // No permite reducir por debajo de comprometidas (007/RF-30)
        var reduceBelow = () => night.UpdateQuantityTotal(0);
        reduceBelow.Should().Throw<DomainException>();

        night.UpdateQuantityTotal(1);
        night.AvailableQuantity.Should().Be(0);

        night.ReleaseRoom(1);
        night.AvailableQuantity.Should().Be(1);

        // Subtotal = tarifa base × noches, sin multiplicar por viajeros (007/RF-32)
        var snapshot = new ReservationLodgingSnapshot(
            proposalId: 5,
            hotelName: "Hotel Mirador",
            roomTypeName: "Doble",
            capacity: 2,
            checkInDate: new DateOnly(2026, 12, 15),
            checkOutDate: new DateOnly(2026, 12, 17),
            nightlyRate: Money.Create(180m));

        snapshot.Nights.Should().Be(2);
        snapshot.Subtotal.Amount.Should().Be(360m);
    }
}
