using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Media;
using DMGoTravel.Domain.Modules.Catalog;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class MediaEndpoints
{
    public static IEndpointRouteBuilder MapMediaEndpoints(this IEndpointRouteBuilder app)
    {
        // Lectura pública de imagen publicada (Spec 012)
        app.MapGet("/api/v1/media/{assetId:guid}", async (
            Guid assetId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var binary = await mediator.Send(new GetPublishedMediaQuery(assetId), cancellationToken);
            httpContext.Response.Headers.CacheControl = "public, max-age=300";
            return Results.File(binary.Content, binary.ContentType);
        })
        .AllowAnonymous()
        .WithTags("Media");

        // Previsualización administrativa privada (sin URL pública temporal)
        app.MapGet("/api/v1/admin/media/{assetId:guid}", async (
            Guid assetId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var binary = await mediator.Send(new GetAdminMediaPreviewQuery(assetId), cancellationToken);
            httpContext.Response.Headers.CacheControl = "no-store";
            return Results.File(binary.Content, binary.ContentType);
        })
        .RequireAuthorization()
        .WithTags("Media");

        // Imágenes de Catálogo (Ofertas)
        var catalog = app.MapGroup("/api/v1/admin/catalog/{type}/{id:guid}/images")
            .WithTags("AdminCatalog")
            .RequireAuthorization();

        catalog.MapPost(string.Empty, async (
            string type,
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new UploadOfferImageCommand(type, id, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Created(asset.Url, asset);
        });

        catalog.MapPut("/{imageId:guid}", async (
            string type,
            Guid id,
            Guid imageId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new ReplaceOfferImageCommand(type, id, imageId, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Ok(asset);
        });

        catalog.MapDelete("/{imageId:guid}", async (
            string type,
            Guid id,
            Guid imageId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            await mediator.Send(new DeleteOfferImageCommand(type, id, imageId), cancellationToken);
            return Results.NoContent();
        });

        // Imágenes de Hoteles y Tipos de Habitación
        var hotels = app.MapGroup("/api/v1/admin/hotels/{id:guid}")
            .WithTags("AdminHotels")
            .RequireAuthorization();

        hotels.MapPost("/images", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new UploadHotelImageCommand(id, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Created(asset.Url, asset);
        });

        hotels.MapPut("/images/{imageId:guid}", async (
            Guid id,
            Guid imageId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new ReplaceHotelImageCommand(id, imageId, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Ok(asset);
        });

        hotels.MapDelete("/images/{imageId:guid}", async (
            Guid id,
            Guid imageId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            await mediator.Send(new DeleteHotelImageCommand(id, imageId), cancellationToken);
            return Results.NoContent();
        });

        hotels.MapPost("/room-types/{roomTypeId:guid}/images", async (
            Guid id,
            Guid roomTypeId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new UploadRoomTypeImageCommand(id, roomTypeId, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Created(asset.Url, asset);
        });

        hotels.MapPut("/room-types/{roomTypeId:guid}/images/{imageId:guid}", async (
            Guid id,
            Guid roomTypeId,
            Guid imageId,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new ReplaceRoomTypeImageCommand(id, roomTypeId, imageId, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Ok(asset);
        });

        hotels.MapDelete("/room-types/{roomTypeId:guid}/images/{imageId:guid}", async (
            Guid id,
            Guid roomTypeId,
            Guid imageId,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            await mediator.Send(new DeleteRoomTypeImageCommand(id, roomTypeId, imageId), cancellationToken);
            return Results.NoContent();
        });

        // Imagen de Movilidad
        app.MapPut("/api/v1/admin/mobility/{id:guid}/image", async (
            Guid id,
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var (bytes, contentType, isPrimary) = await ReadUploadedImageAsync(httpContext.Request, cancellationToken);
            var asset = await mediator.Send(
                new ReplaceMobilityImageCommand(id, bytes, contentType, isPrimary),
                cancellationToken);
            return Results.Ok(asset);
        })
        .RequireAuthorization()
        .WithTags("AdminMobility");

        return app;
    }

    private static async Task<(byte[] Bytes, string? ContentType, bool? IsPrimary)> ReadUploadedImageAsync(
        HttpRequest request,
        CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType)
        {
            throw new UnsupportedMediaTypeAppException("Se requiere multipart/form-data con el archivo de imagen.");
        }

        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
        if (file is null)
        {
            throw new ValidationAppException([
                new FieldError("file", "Debe adjuntar un archivo en el campo 'file'.")
            ]);
        }

        if (file.Length > MediaAsset.MaxImageSizeBytes)
        {
            throw new PayloadTooLargeAppException();
        }

        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        var buffer = new byte[81920];
        long totalRead = 0;
        int read;
        while ((read = await stream.ReadAsync(buffer, cancellationToken)) > 0)
        {
            totalRead += read;
            if (totalRead > MediaAsset.MaxImageSizeBytes)
            {
                throw new PayloadTooLargeAppException();
            }

            memory.Write(buffer, 0, read);
        }

        bool? isPrimary = null;
        if (form.TryGetValue("isPrimary", out var rawIsPrimary) &&
            bool.TryParse(rawIsPrimary.FirstOrDefault(), out var parsedIsPrimary))
        {
            isPrimary = parsedIsPrimary;
        }

        return (memory.ToArray(), file.ContentType, isPrimary);
    }
}
