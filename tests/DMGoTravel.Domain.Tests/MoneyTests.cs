using DMGoTravel.Domain.Common;
using FluentAssertions;
using Xunit;

namespace DMGoTravel.Domain.Tests;

public class MoneyTests
{
    [Fact(DisplayName = "Money debe crearse con moneda PEN y redondearse a 2 decimales simétricos")]
    public void Create_WithValidAmount_ShouldHavePenCurrencyAndTwoDecimals()
    {
        // Act
        var money = Money.Create(150.456m);

        // Assert
        money.Currency.Should().Be("PEN");
        money.Amount.Should().Be(150.46m);
        money.ToString().Should().Be("150.46");
    }

    [Fact(DisplayName = "Money debe lanzar DomainException si el importe es negativo")]
    public void Create_WithNegativeAmount_ShouldThrowDomainException()
    {
        // Act
        var act = () => Money.Create(-10m);

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("*no puede ser negativo*");
    }

    [Fact(DisplayName = "Suma de Money debe acumular correctamente los importes")]
    public void Add_TwoMoneyObjects_ShouldReturnSum()
    {
        // Arrange
        var tourPrice = Money.Create(100.50m);
        var hotelPrice = Money.Create(200.25m);

        // Act
        var total = tourPrice + hotelPrice;

        // Assert
        total.Amount.Should().Be(300.75m);
        total.Currency.Should().Be("PEN");
    }

    [Fact(DisplayName = "Resta de Money no debe permitir saldo negativo")]
    public void Subtract_WhenResultIsNegative_ShouldThrowDomainException()
    {
        // Arrange
        var price = Money.Create(50m);
        var payment = Money.Create(100m);

        // Act
        var act = () => price - payment;

        // Assert
        act.Should().Throw<DomainException>()
            .WithMessage("*no puede producir un importe negativo*");
    }

    [Fact(DisplayName = "Multiplicación de Money por factor entero de pasajeros")]
    public void Multiply_ByPassengers_ShouldScaleAmount()
    {
        // Arrange
        var pricePerPerson = Money.Create(85.50m);
        const int passengers = 4;

        // Act
        var total = pricePerPerson * passengers;

        // Assert
        total.Amount.Should().Be(342.00m);
    }

    [Fact(DisplayName = "Aplicación de descuento porcentual con redondeo financiero")]
    public void ApplyDiscountPercentage_ShouldCalculateProperDiscount()
    {
        // Arrange
        var originalPrice = Money.Create(199.99m);
        const decimal discountPercent = 15m; // 15%

        // Act
        var discounted = originalPrice.ApplyDiscountPercentage(discountPercent);

        // Assert (199.99 * 0.85 = 169.9915 -> 169.99)
        discounted.Amount.Should().Be(169.99m);
    }
}
