using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Catalog.Dtos;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Catalog.GetCatalogOffer;

public sealed record GetCatalogOfferQuery(string Type, Guid Id) : IRequest<CatalogOfferDetailDto>;

public sealed class GetCatalogOfferQueryValidator : AbstractValidator<GetCatalogOfferQuery>
{
    public GetCatalogOfferQueryValidator()
    {
        RuleFor(query => query.Type)
            .Must(type => type is "tours" or "packages")
            .WithMessage("El tipo debe ser tours o packages.");

        RuleFor(query => query.Id)
            .NotEmpty().WithMessage("El identificador es obligatorio.");
    }
}

public sealed class GetCatalogOfferQueryHandler : IRequestHandler<GetCatalogOfferQuery, CatalogOfferDetailDto>
{
    private readonly IOfferRepository _offers;
    private readonly IDateTimeProvider _clock;

    public GetCatalogOfferQueryHandler(IOfferRepository offers, IDateTimeProvider clock)
    {
        _offers = offers;
        _clock = clock;
    }

    public async Task<CatalogOfferDetailDto> Handle(GetCatalogOfferQuery request, CancellationToken cancellationToken)
    {
        var type = CatalogMapper.ParseApiType(request.Type);
        var offer = await _offers.GetActiveByPublicIdAsync(request.Id, type, cancellationToken);

        if (offer is null)
        {
            throw new NotFoundAppException("La oferta no existe o no está disponible.");
        }

        return CatalogMapper.ToDetail(offer, _clock.UtcNow);
    }
}
