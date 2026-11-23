using DMGoTravel.Application.Common.Interfaces;

namespace DMGoTravel.Infrastructure.Services;

public sealed class DateTimeProvider : IDateTimeProvider
{
    private static readonly TimeZoneInfo PeruTimeZone = 
        TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "SA Pacific Standard Time" : "America/Lima");

    public DateTime UtcNow => DateTime.UtcNow;

    public DateOnly TodayInPeru
    {
        get
        {
            var peruTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, PeruTimeZone);
            return DateOnly.FromDateTime(peruTime);
        }
    }

    public DateTime ToUtcStartOfDay(DateOnly date) =>
        TimeZoneInfo.ConvertTimeToUtc(
            date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            PeruTimeZone);

    public DateTime ToUtcStartOfNextDay(DateOnly date) =>
        date == DateOnly.MaxValue
            ? DateTime.MaxValue
            : ToUtcStartOfDay(date.AddDays(1));
}
