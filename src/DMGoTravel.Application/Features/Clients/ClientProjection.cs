using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Clients.Dtos;
using DMGoTravel.Domain.Modules.Identity;

namespace DMGoTravel.Application.Features.Clients;

internal static class ClientProjection
{
    public static ClientSummaryDto ToDto(ClientRecord record)
    {
        if (record.IsDeleted || record.Status == UserStatus.Closed)
        {
            return new ClientSummaryDto(
                record.PublicId,
                null,
                null,
                null,
                null,
                ToStatus(UserStatus.Closed),
                record.ReservationCount,
                null);
        }

        return new ClientSummaryDto(
            record.PublicId,
            record.FullName,
            record.Email,
            record.Phone,
            record.EmailVerified,
            ToStatus(record.Status),
            record.ReservationCount,
            DateTime.SpecifyKind(record.RegisteredAtUtc, DateTimeKind.Utc));
    }

    public static string ToStatus(UserStatus status) => status switch
    {
        UserStatus.Active => "active",
        UserStatus.Suspended => "suspended",
        UserStatus.Closed => "closed",
        _ => status.ToString().ToLowerInvariant()
    };
}
