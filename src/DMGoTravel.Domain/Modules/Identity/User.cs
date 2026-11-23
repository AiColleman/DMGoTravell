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

    public void SoftDelete()
    {
        Status = UserStatus.Closed;
        DeletedAtUtc = DateTime.UtcNow;
        SecurityVersion++;
    }
}
