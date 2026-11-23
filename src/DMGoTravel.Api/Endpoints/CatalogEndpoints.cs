using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Features.Catalog.GetCatalogOffer;
using DMGoTravel.Application.Features.Catalog.ListCatalog;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/catalog").WithTags("Catalog");

        group.MapGet("/{type}", async (
            string type,
            string? page,
            int? pageSize,
            decimal? priceMin,
            decimal? priceMax,
            int? durationMin,
            int? durationMax,
            DateOnly? startDate,
            DateOnly? endDate,
            string? destination,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ListCatalogQuery(
                    type,
                    Pagination.ParsePage(page),
                    pageSize ?? 10,
                    priceMin,
                    priceMax,
                    durationMin,
                    durationMax,
                    startDate,
                    endDate,
                    destination),
                cancellationToken);

            return Results.Ok(result);
        })
        .AllowAnonymous();

        group.MapGet("/{type}/{id:guid}", async (
            string type,
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetCatalogOfferQuery(type, id), cancellationToken);
            return Results.Ok(result);
        })
        .AllowAnonymous();

        return app;
    }
}
