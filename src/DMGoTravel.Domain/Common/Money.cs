namespace DMGoTravel.Domain.Common;

/// <summary>
/// Value Object que representa importes monetarios oficiales en DMGOTRAVEL.
/// Cumple estrictamente con:
/// - Moneda única "PEN" (Soles peruanos).
/// - 2 decimales exactos con redondeo simétrico (MidpointRounding.AwayFromZero).
/// - Importes siempre >= 0.
/// - Inmutabilidad y precisión financiera conforme a DT-11, DT-12 y MD-01.
/// </summary>
public sealed class Money : ValueObject, IComparable<Money>
{
    public const string DefaultCurrency = "PEN";

    public decimal Amount { get; }
    public string Currency { get; }

    // Constructor para materialización de EF Core; no se usa en lógica de dominio.
    private Money()
    {
        Amount = 0m;
        Currency = DefaultCurrency;
    }

    private Money(decimal amount, string currency)
    {
        if (amount < 0)
        {
            throw new DomainException("El importe monetario no puede ser negativo.");
        }

        if (currency != DefaultCurrency)
        {
            throw new DomainException($"Moneda no admitida '{currency}'. DMGOTRAVEL opera exclusivamente en {DefaultCurrency}.");
        }

        Amount = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        Currency = currency;
    }

    public static Money Create(decimal amount) => new(amount, DefaultCurrency);

    public static Money Zero() => new(0m, DefaultCurrency);

    /// <summary>
    /// Devuelve una instancia independiente. Necesario para que EF Core no comparta
    /// el mismo objeto entre distintas navegaciones owned.
    /// </summary>
    public Money Copy() => new(Amount, Currency);

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        if (Amount < other.Amount)
        {
            throw new DomainException("El resultado de la resta no puede producir un importe negativo.");
        }
        return new Money(Amount - other.Amount, Currency);
    }

    public Money Multiply(int factor)
    {
        if (factor < 0)
        {
            throw new DomainException("El factor de multiplicación no puede ser negativo.");
        }
        return new Money(Amount * factor, Currency);
    }

    public Money ApplyDiscountPercentage(decimal percentage)
    {
        if (percentage < 0 || percentage > 100)
        {
            throw new DomainException("El porcentaje de descuento debe estar entre 0 y 100.");
        }
        var discount = Amount * (percentage / 100m);
        var finalAmount = Amount - discount;
        return new Money(finalAmount, Currency);
    }

    private void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
        {
            throw new DomainException($"No se pueden operar importes de diferentes monedas: {Currency} vs {other.Currency}.");
        }
    }

    public int CompareTo(Money? other)
    {
        if (other is null) return 1;
        EnsureSameCurrency(other);
        return Amount.CompareTo(other.Amount);
    }

    public static Money operator +(Money left, Money right) => left.Add(right);
    public static Money operator -(Money left, Money right) => left.Subtract(right);
    public static Money operator *(Money left, int factor) => left.Multiply(factor);

    public static bool operator <(Money left, Money right) => left.CompareTo(right) < 0;
    public static bool operator <=(Money left, Money right) => left.CompareTo(right) <= 0;
    public static bool operator >(Money left, Money right) => left.CompareTo(right) > 0;
    public static bool operator >=(Money left, Money right) => left.CompareTo(right) >= 0;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }

    public override string ToString() => Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
}
