using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Identity;

public class User : Entity<long>
{
    public string Email { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Role { get; private set; } = UserRole.Client;
    public bool IsEmailVerified { get; private set; }
    public UserStatus Status { get; private set; } = UserStatus.Active;
    public int SecurityVersion { get; private set; } = 1;
    public DateTime? DeletedAtUtc { get; private set; }

    public string? EmailVerificationTokenHash { get; private set; }
    public DateTime? EmailVerificationExpiresAtUtc { get; private set; }

    public string? PasswordResetTokenHash { get; private set; }
    public DateTime? PasswordResetExpiresAtUtc { get; private set; }

    public string? PendingEmail { get; private set; }
    public string? PendingNormalizedEmail { get; private set; }
    public string? EmailChangeTokenHash { get; private set; }
    public DateTime? EmailChangeRequestedAtUtc { get; private set; }
    public DateTime? EmailChangeExpiresAtUtc { get; private set; }

    public UserProfile? Profile { get; private set; }

    private User() { }

    public static User CreateClient(string email, string passwordHash, string fullName, string? phone)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("El correo electrónico es obligatorio.");

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("La contraseña hash es obligatoria.");

        var user = new User
        {
            Email = email.Trim().ToLowerInvariant(),
            NormalizedEmail = email.Trim().ToUpperInvariant(),
            PasswordHash = passwordHash,
            Role = UserRole.Client,
            IsEmailVerified = false,
            Status = UserStatus.Active,
            CreatedAtUtc = DateTime.UtcNow
        };

        user.Profile = new UserProfile(user.Id, fullName, phone);
        return user;
    }

    public static User CreateAdmin(string email, string passwordHash, string fullName)
    {
        var user = CreateClient(email, passwordHash, fullName, null);
        user.Role = UserRole.Admin;
        user.IsEmailVerified = true;
        return user;
    }

    public void SetEmailVerificationToken(string tokenHash, DateTime expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new DomainException("El hash de verificación es obligatorio.");

        EmailVerificationTokenHash = tokenHash;
        EmailVerificationExpiresAtUtc = expiresAtUtc;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    public void VerifyEmail()
    {
        IsEmailVerified = true;
        EmailVerificationTokenHash = null;
        EmailVerificationExpiresAtUtc = null;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    public void SetPasswordResetToken(string tokenHash, DateTime expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new DomainException("El hash de restablecimiento es obligatorio.");

        PasswordResetTokenHash = tokenHash;
        PasswordResetExpiresAtUtc = expiresAtUtc;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    /// <summary>
    /// Cambia la contraseña, invalida el enlace de restablecimiento y revoca globalmente
    /// las sesiones al incrementar la versión de seguridad (DEC-144/DEC-147).
    /// </summary>
    public void ChangePassword(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("La contraseña hash es obligatoria.");

        PasswordHash = passwordHash;
        PasswordResetTokenHash = null;
        PasswordResetExpiresAtUtc = null;
        SecurityVersion++;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;
    }

    public void UpdateProfile(string? fullName, bool hasPhone, string? phone, DateTime updatedAtUtc)
    {
        if (Profile is null)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new DomainException("El nombre completo es obligatorio.");

            Profile = new UserProfile(Id, fullName, hasPhone ? NormalizePhone(phone) : null);
        }
        else
        {
            var nextFullName = fullName ?? Profile.FullName;
            var nextPhone = hasPhone ? NormalizePhone(phone) : Profile.Phone;
            Profile.Update(nextFullName, nextPhone);
        }

        UpdatedAtUtc = updatedAtUtc;
        RowVersion++;
    }

    public void RequestEmailChange(
        string newEmail,
        string tokenHash,
        DateTime requestedAtUtc,
        DateTime expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(newEmail))
            throw new DomainException("El nuevo correo electrónico es obligatorio.");

        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new DomainException("El hash de cambio de correo es obligatorio.");

        PendingEmail = newEmail.Trim().ToLowerInvariant();
        PendingNormalizedEmail = newEmail.Trim().ToUpperInvariant();
        EmailChangeTokenHash = tokenHash;
        EmailChangeRequestedAtUtc = requestedAtUtc;
        EmailChangeExpiresAtUtc = expiresAtUtc;
        UpdatedAtUtc = requestedAtUtc;
        RowVersion++;
    }

    public void ConfirmEmailChange(DateTime confirmedAtUtc)
    {
        if (string.IsNullOrWhiteSpace(PendingEmail) || string.IsNullOrWhiteSpace(PendingNormalizedEmail))
            throw new DomainException("No existe una solicitud vigente de cambio de correo.");

        Email = PendingEmail;
        NormalizedEmail = PendingNormalizedEmail;
        IsEmailVerified = true;

        PendingEmail = null;
        PendingNormalizedEmail = null;
        EmailChangeTokenHash = null;
        EmailChangeRequestedAtUtc = null;
        EmailChangeExpiresAtUtc = null;

        EmailVerificationTokenHash = null;
        EmailVerificationExpiresAtUtc = null;
        PasswordResetTokenHash = null;
        PasswordResetExpiresAtUtc = null;

        SecurityVersion++;
        UpdatedAtUtc = confirmedAtUtc;
        RowVersion++;
    }

    public void SoftDelete(DateTime? deletedAtUtc = null)
    {
        var now = deletedAtUtc ?? DateTime.UtcNow;
        Status = UserStatus.Closed;
        DeletedAtUtc = now;

        PendingEmail = null;
        PendingNormalizedEmail = null;
        EmailChangeTokenHash = null;
        EmailChangeRequestedAtUtc = null;
        EmailChangeExpiresAtUtc = null;
        EmailVerificationTokenHash = null;
        EmailVerificationExpiresAtUtc = null;
        PasswordResetTokenHash = null;
        PasswordResetExpiresAtUtc = null;

        SecurityVersion++;
        UpdatedAtUtc = now;
        RowVersion++;
    }

    private static string? NormalizePhone(string? phone) =>
        string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
}
