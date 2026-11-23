using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Identity;

/// <summary>
/// Refresh opaco de un solo uso. Se persiste únicamente su digest y se agrupa por familia
/// para detectar reutilización sin extender la vigencia absoluta de la sesión.
/// </summary>
public class RefreshToken : Entity<long>
{
    public long UserId { get; private set; }
    public Guid FamilyId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTime IssuedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime FamilyExpiresAtUtc { get; private set; }
    public DateTime? ConsumedAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }
    public long SecurityVersion { get; private set; }

    public User User { get; private set; } = null!;

    private RefreshToken() { }

    public static RefreshToken Create(
        User user,
        Guid familyId,
        string tokenHash,
        DateTime issuedAtUtc,
        DateTime familyExpiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new DomainException("El digest del refresh es obligatorio.");

        if (familyExpiresAtUtc <= issuedAtUtc)
            throw new DomainException("La vigencia absoluta de la familia debe ser futura.");

        return new RefreshToken
        {
            User = user,
            FamilyId = familyId,
            TokenHash = tokenHash,
            IssuedAtUtc = issuedAtUtc,
            ExpiresAtUtc = familyExpiresAtUtc,
            FamilyExpiresAtUtc = familyExpiresAtUtc,
            SecurityVersion = user.SecurityVersion,
            CreatedAtUtc = issuedAtUtc
        };
    }

    public bool IsUsable(DateTime nowUtc) =>
        RevokedAtUtc is null &&
        ConsumedAtUtc is null &&
        ExpiresAtUtc > nowUtc;

    public void Consume(string replacedByTokenHash, DateTime consumedAtUtc)
    {
        if (ConsumedAtUtc is not null)
            throw new DomainException("El refresh ya fue consumido.");

        ConsumedAtUtc = consumedAtUtc;
        ReplacedByTokenHash = replacedByTokenHash;
        UpdatedAtUtc = consumedAtUtc;
        RowVersion++;
    }

    public void Revoke(DateTime revokedAtUtc)
    {
        if (RevokedAtUtc is not null)
            return;

        RevokedAtUtc = revokedAtUtc;
        UpdatedAtUtc = revokedAtUtc;
        RowVersion++;
    }
}
