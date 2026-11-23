using DMGoTravel.Application.Features.Profile.GetProfile;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/profile", async (IMediator mediator, CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetProfileQuery(), cancellationToken);
            return Results.Ok(result);
        })
        .WithTags("Profile")
        .RequireAuthorization();

        return app;
    }
}
