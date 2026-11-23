using System.Text;

namespace DMGoTravel.Api.Endpoints;

/// <summary>
/// Sirve el contrato oficial OpenAPI 3.1 (dmgo-api-v1.yaml) y una interfaz interactiva Swagger UI
/// en /swagger conforme a ADR-015.
/// </summary>
public static class OpenApiEndpoints
{
    public static IEndpointRouteBuilder MapOpenApiEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/openapi/v1.yaml", async (HttpContext httpContext, IHostEnvironment env, CancellationToken cancellationToken) =>
        {
            var specPath = ResolveOpenApiPath(env.ContentRootPath);
            if (specPath is null)
            {
                return Results.NotFound(new { detail = "Archivo OpenAPI dmgo-api-v1.yaml no encontrado." });
            }

            var yaml = await File.ReadAllTextAsync(specPath, Encoding.UTF8, cancellationToken);
            var origin = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
            yaml = yaml.Replace("https://api.example.test", origin, StringComparison.Ordinal);

            return Results.Text(yaml, "application/yaml; charset=utf-8");
        })
        .AllowAnonymous()
        .WithTags("Documentation");

        app.MapGet("/swagger", () =>
        {
            const string html = """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DMGOTRAVEL API v1 — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar-wrapper .link span { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/openapi/v1.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true
      });
    };
  </script>
</body>
</html>
""";
            return Results.Content(html, "text/html; charset=utf-8");
        })
        .AllowAnonymous()
        .WithTags("Documentation");

        return app;
    }

    private static string? ResolveOpenApiPath(string contentRoot)
    {
        var current = new DirectoryInfo(contentRoot);
        for (var i = 0; i < 6 && current is not null; i++)
        {
            var candidate = Path.Combine(current.FullName, "sdd", "diseno", "openapi", "dmgo-api-v1.yaml");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        return null;
    }
}
