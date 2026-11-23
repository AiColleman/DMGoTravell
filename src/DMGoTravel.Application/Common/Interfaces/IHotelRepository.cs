using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Hotels;

namespace DMGoTravel.Application.Common.Interfaces;

public interface IHotelRepository
{
    Task<IReadOnlyList<Hotel>> ListActiveOrderedAsync(CancellationToken cancellationToken = default);
    Task<Hotel?> GetActiveByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Hotel> Items, int Total)> ListAdminAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<Hotel?> GetByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task<Hotel?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<bool> ExistsActiveWithNormalizedKeyAsync(string normalizedKey, long? excludeId = null, CancellationToken cancellationToken = default);
    Task AddHotelAsync(Hotel hotel, CancellationToken cancellationToken = default);

    Task<RoomType?> GetRoomTypeByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task AddRoomTypeAsync(RoomType roomType, CancellationToken cancellationToken = default);

    Task<RoomInventoryNight?> GetInventoryNightAsync(long roomTypeId, DateOnly stayDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomInventoryNight>> GetInventoryNightsAsync(long roomTypeId, DateOnly checkInDate, DateOnly checkOutDate, CancellationToken cancellationToken = default);
    Task AddInventoryNightAsync(RoomInventoryNight night, CancellationToken cancellationToken = default);
    Task<HashSet<long>> GetHotelsWithFutureAvailabilityAsync(IReadOnlyCollection<long> hotelIds, DateOnly fromDate, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MediaAsset>> GetImagesForHotelsAsync(IReadOnlyCollection<long> hotelIds, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaAsset>> GetImagesForRoomTypesAsync(IReadOnlyCollection<long> roomTypeIds, CancellationToken cancellationToken = default);
    Task<bool> HasHotelImageAsync(long hotelId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LodgingProposal>> ListActiveProposalsByDepartureIdAsync(long departureId, CancellationToken cancellationToken = default);
    Task<LodgingProposal?> GetProposalByPublicIdAsync(Guid publicId, CancellationToken cancellationToken = default);
    Task AddProposalAsync(LodgingProposal proposal, CancellationToken cancellationToken = default);
}
