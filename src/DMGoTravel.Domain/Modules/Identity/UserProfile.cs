using DMGoTravel.Domain.Common;

namespace DMGoTravel.Domain.Modules.Identity;

public class UserProfile : Entity<long>
{
    public long UserId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? Phone { get; private set; }

    private UserProfile() { }

    public UserProfile(long userId, string fullName, string? phone)
    {
        UserId = userId;
        Update(fullName, phone);
    }

    public void Update(string fullName, string? phone)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("El nombre completo es obligatorio.");
        }

        FullName = fullName.Trim();
        Phone = phone?.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
