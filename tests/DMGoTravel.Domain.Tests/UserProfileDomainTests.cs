using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Identity;
using FluentAssertions;

namespace DMGoTravel.Domain.Tests;

public sealed class UserProfileDomainTests
{
    [Fact(DisplayName = "Perfil: actualiza nombre y teléfono sin alterar correo ni versión de seguridad")]
    public void UpdateProfile_ShouldPreserveEmailAndSecurityVersion()
    {
        var user = User.CreateClient("cliente@example.test", "hash-ficticio", "Ana Pérez", "+51999999999");
        var initialSecurityVersion = user.SecurityVersion;
        var now = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);

        user.UpdateProfile("Ana María Pérez", hasPhone: false, phone: null, now);
        user.Profile!.FullName.Should().Be("Ana María Pérez");
        user.Profile.Phone.Should().Be("+51999999999");
        user.Email.Should().Be("cliente@example.test");
        user.SecurityVersion.Should().Be(initialSecurityVersion);

        user.UpdateProfile(null, hasPhone: true, phone: "   ", now.AddMinutes(1));
        user.Profile.FullName.Should().Be("Ana María Pérez");
        user.Profile.Phone.Should().BeNull();
        user.SecurityVersion.Should().Be(initialSecurityVersion);
    }

    [Fact(DisplayName = "Perfil: rechaza nombre vacío en actualización")]
    public void UpdateProfile_WithBlankName_ShouldThrowDomainException()
    {
        var user = User.CreateClient("cliente@example.test", "hash-ficticio", "Ana Pérez", null);
        var act = () => user.UpdateProfile("   ", hasPhone: false, phone: null, DateTime.UtcNow);
        act.Should().Throw<DomainException>();
    }

    [Fact(DisplayName = "Cambio de correo: conserva correo actual hasta confirmar y luego revoca sesiones y enlaces")]
    public void EmailChange_ShouldApplyOnlyOnConfirmAndInvalidateTokensAndSessions()
    {
        var user = User.CreateClient("antes@example.test", "hash-ficticio", "Ana Pérez", null);
        user.SetEmailVerificationToken("verify-hash", DateTime.UtcNow.AddHours(1));
        user.SetPasswordResetToken("reset-hash", DateTime.UtcNow.AddHours(1));
        var initialSecurityVersion = user.SecurityVersion;
        var now = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);

        user.RequestEmailChange("despues@example.test", "change-hash-1", now, now.AddMinutes(30));
        user.Email.Should().Be("antes@example.test");
        user.PendingEmail.Should().Be("despues@example.test");
        user.SecurityVersion.Should().Be(initialSecurityVersion);

        // Segunda solicitud sustituye la anterior (008/RF-13)
        user.RequestEmailChange("final@example.test", "change-hash-2", now.AddMinutes(5), now.AddMinutes(35));
        user.PendingEmail.Should().Be("final@example.test");
        user.EmailChangeTokenHash.Should().Be("change-hash-2");

        // Confirmación aplica el correo verificado, revoca sesiones y limpia enlaces (008/RF-16-RF-19)
        user.ConfirmEmailChange(now.AddMinutes(10));
        user.Email.Should().Be("final@example.test");
        user.NormalizedEmail.Should().Be("FINAL@EXAMPLE.TEST");
        user.IsEmailVerified.Should().BeTrue();
        user.PendingEmail.Should().BeNull();
        user.EmailChangeTokenHash.Should().BeNull();
        user.EmailVerificationTokenHash.Should().BeNull();
        user.PasswordResetTokenHash.Should().BeNull();
        user.SecurityVersion.Should().Be(initialSecurityVersion + 1);
    }

    [Fact(DisplayName = "Baja lógica: cierra cuenta, invalida enlaces/sesiones y conserva correo único")]
    public void SoftDelete_ShouldCloseAccountInvalidateTokensAndPreserveEmail()
    {
        var user = User.CreateClient("baja@example.test", "hash-ficticio", "Ana Pérez", null);
        var now = new DateTime(2026, 11, 23, 15, 0, 0, DateTimeKind.Utc);
        user.RequestEmailChange("nuevo@example.test", "change-hash", now, now.AddMinutes(30));
        user.SetPasswordResetToken("reset-hash", now.AddHours(1));
        var initialSecurityVersion = user.SecurityVersion;

        user.SoftDelete(now.AddMinutes(2));

        user.Status.Should().Be(UserStatus.Closed);
        user.DeletedAtUtc.Should().Be(now.AddMinutes(2));
        user.Email.Should().Be("baja@example.test");
        user.NormalizedEmail.Should().Be("BAJA@EXAMPLE.TEST");
        user.PendingEmail.Should().BeNull();
        user.EmailChangeTokenHash.Should().BeNull();
        user.PasswordResetTokenHash.Should().BeNull();
        user.SecurityVersion.Should().Be(initialSecurityVersion + 1);
    }
}
