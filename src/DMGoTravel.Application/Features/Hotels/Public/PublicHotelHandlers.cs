using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Hotels.Dtos;
using DMGoTravel.Domain.Modules.Catalog;
using MediatR;

namespace DMGoTravel.Application.Features.Hotels.Public;

public sealed record ListPublicHotelsQuery : IRequest<HotelPublicListDto>;

public sealed class ListPublicHotelsQueryHandler : IRequestHandler<ListPublicHotelsQuery, HotelPublicListDto>
{
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;

    public ListPublicHotelsQueryHandler(IHotelRepository hotels, IDateTimeProvider clock)
    {
        _hotels = hotels;
        _clock = clock;
    }

    public async Task<HotelPublicListDto> Handle(ListPublicHotelsQuery request, CancellationToken cancellationToken)
    {
        var hotels = await _hotels.ListActiveOrderedAsync(cancellationToken);
        var hotelIds = hotels.Select(h => h.Id).ToList();
        var today = _clock.TodayInPeru;

        var availableHotels = await _hotels.GetHotelsWithFutureAvailabilityAsync(hotelIds, today, cancellationToken);
        var images = await _hotels.GetImagesForHotelsAsync(hotelIds, cancellationToken);
        var imagesByHotel = images
            .Where(i => i.HotelId.HasValue)
            .GroupBy(i => i.HotelId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var items = hotels
            .Select(h => HotelMapper.ToPublicItemDto(
                h,
                imagesByHotel.TryGetValue(h.Id, out var list) ? list : [],
                availableHotels.Contains(h.Id)))
            .ToList();

        return new HotelPublicListDto(items);
    }
}

public sealed record GetPublicHotelQuery(Guid Id) : IRequest<HotelPublicDetailDto>;

public sealed class GetPublicHotelQueryHandler : IRequestHandler<GetPublicHotelQuery, HotelPublicDetailDto>
{
    private readonly IHotelRepository _hotels;
    private readonly IDateTimeProvider _clock;

    public GetPublicHotelQueryHandler(IHotelRepository hotels, IDateTimeProvider clock)
    {
        _hotels = hotels;
        _clock = clock;
    }

    public async Task<HotelPublicDetailDto> Handle(GetPublicHotelQuery request, CancellationToken cancellationToken)
    {
        var hotel = await _hotels.GetActiveByPublicIdAsync(request.Id, cancellationToken);
        if (hotel is null)
        {
            throw new NotFoundAppException("Hotel no disponible.");
        }

        var today = _clock.TodayInPeru;
        var availableHotels = await _hotels.GetHotelsWithFutureAvailabilityAsync([hotel.Id], today, cancellationToken);
        var hotelImages = await _hotels.GetImagesForHotelsAsync([hotel.Id], cancellationToken);
        var roomTypeIds = hotel.RoomTypes.Select(r => r.Id).ToList();
        var roomImagesList = await _hotels.GetImagesForRoomTypesAsync(roomTypeIds, cancellationToken);
        var roomImages = roomImagesList
            .Where(i => i.RoomTypeId.HasValue)
            .GroupBy(i => i.RoomTypeId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        return HotelMapper.ToPublicDetailDto(hotel, hotelImages, roomImages, availableHotels.Contains(hotel.Id));
    }
}

public sealed record ListLodgingByDepartureQuery(Guid DepartureId) : IRequest<LodgingProposalListDto>;

public sealed class ListLodgingByDepartureQueryHandler
    : IRequestHandler<ListLodgingByDepartureQuery, LodgingProposalListDto>
{
    private readonly IOfferRepository _offers;
    private readonly IHotelRepository _hotels;

    public ListLodgingByDepartureQueryHandler(IOfferRepository offers, IHotelRepository hotels)
    {
        _offers = offers;
        _hotels = hotels;
    }

    public async Task<LodgingProposalListDto> Handle(
        ListLodgingByDepartureQuery request,
        CancellationToken cancellationToken)
    {
        var departure = await _offers.GetDepartureByPublicIdAsync(request.DepartureId, cancellationToken);
        if (departure is null || !departure.IsActive)
        {
            throw new NotFoundAppException("La salida no existe o no está disponible.");
        }

        var proposals = await _hotels.ListActiveProposalsByDepartureIdAsync(departure.Id, cancellationToken);
        var items = new List<LodgingProposalDto>();

        foreach (var proposal in proposals)
        {
            var hotel = await _hotels.GetByIdAsync(proposal.HotelId, cancellationToken);
            if (hotel is null || !hotel.IsActive)
            {
                continue;
            }

            var roomTypeIds = hotel.RoomTypes.Where(r => r.IsActive && r.DeletedAtUtc is null).Select(r => r.Id).ToList();
            if (roomTypeIds.Count == 0)
            {
                continue;
            }

            var roomImagesList = await _hotels.GetImagesForRoomTypesAsync(roomTypeIds, cancellationToken);
            var roomImages = roomImagesList
                .Where(i => i.RoomTypeId.HasValue)
                .GroupBy(i => i.RoomTypeId!.Value)
                .ToDictionary(g => g.Key, g => g.ToList());

            items.Add(HotelMapper.ToProposalDto(proposal, hotel, departure.PublicId, roomImages));
        }

        return new LodgingProposalListDto(items);
    }
}
