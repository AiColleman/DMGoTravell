using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Mobility.Dtos;
using MediatR;

namespace DMGoTravel.Application.Features.Mobility.ListPublicMobility;

public sealed record ListPublicMobilityQuery : IRequest<MobilityPublicListDto>;

public sealed class ListPublicMobilityQueryHandler
    : IRequestHandler<ListPublicMobilityQuery, MobilityPublicListDto>
{
    private readonly IMobilityRepository _mobility;

    public ListPublicMobilityQueryHandler(IMobilityRepository mobility)
    {
        _mobility = mobility;
    }

    public async Task<MobilityPublicListDto> Handle(
        ListPublicMobilityQuery request,
        CancellationToken cancellationToken)
    {
        var items = await _mobility.ListActiveOrderedAsync(cancellationToken);
        return new MobilityPublicListDto(items.Select(MobilityMapper.ToPublicDto).ToList());
    }
}
