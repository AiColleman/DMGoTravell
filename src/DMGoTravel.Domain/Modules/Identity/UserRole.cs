namespace DMGoTravel.Domain.Modules.Identity;

public static class UserRole
{
    public const string Client = "client";
    public const string Admin = "admin";

    public static readonly IReadOnlyCollection<string> All = [Client, Admin];
}
