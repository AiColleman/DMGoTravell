using DMGoTravel.Api.Auth;
using DMGoTravel.Api.Endpoints;
using DMGoTravel.Api.Middlewares;
using DMGoTravel.Application;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Infrastructure;
using DMGoTravel.Infrastructure.Auth;
using DMGoTravel.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// En este entorno Windows el proveedor EventLog puede fallar por permisos.
// La API usa consola para que un fallo de infraestructura no derribe el proceso.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Las claves de protección de datos se guardan en App_Data, fuera de Git.
var dataProtectionKeysPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "keys");
Directory.CreateDirectory(dataProtectionKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
    .SetApplicationName("DMGoTravel");

// Registro de capas de Clean Architecture
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<ICorrelationContext, HttpCorrelationContext>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<JwtKeyProvider>((options, keys) =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = keys.CreateValidationParameters();

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.Headers.WWWAuthenticate = "Bearer";
                await WriteProblemAsync(
                    context.HttpContext,
                    StatusCodes.Status401Unauthorized,
                    "unauthenticated",
                    "No autenticado",
                    "Se requiere autenticación para acceder a este recurso.");
            },
            OnForbidden = async context =>
            {
                await WriteProblemAsync(
                    context.HttpContext,
                    StatusCodes.Status403Forbidden,
                    "forbidden",
                    "Prohibido",
                    "No tiene permisos para realizar esta operación.");
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("spa", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware de tratamiento global de errores RFC 7807 (DEC-220)
app.UseMiddleware<ProblemDetailsMiddleware>();

app.UseCors("spa");
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();

// Endpoint de diagnóstico de salud
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "DMGoTravel.Api",
    version = "0.1.0-alpha",
    timestamp = DateTime.UtcNow
}));

app.MapAuthEndpoints();
app.MapCatalogEndpoints();
app.MapAdminCatalogEndpoints();
app.MapHotelEndpoints();
app.MapMobilityEndpoints();
app.MapReservationEndpoints();
app.MapPaymentEndpoints();
app.MapProfileEndpoints();
app.MapAdminReservationEndpoints();
app.MapAdminClientEndpoints();
app.MapAuditEndpoints();
app.MapAdminExportEndpoints();
app.MapAdminReportEndpoints();
app.MapWebhookEndpoints();
app.MapAdminRefundEndpoints();
app.MapAdminNotificationEndpoints();
app.MapMediaEndpoints();

if (app.Environment.IsDevelopment())
{
    // Herramienta local para obtener el token de verificación sin enviar correo real.
    app.MapGet("/api/v1/auth/dev/verification-token", (string email, IDevEmailTokenStore store) =>
    {
        if (store.TryGet(email, out var token) && token is not null)
        {
            return Results.Ok(new { token });
        }

        return Results.NotFound();
    })
    .AllowAnonymous()
    .WithTags("Dev");

    // Herramienta local para obtener el token de restablecimiento sin enviar correo real.
    app.MapGet("/api/v1/auth/dev/password-reset-token", (string email, IDevEmailTokenStore store) =>
    {
        if (store.TryGetPasswordReset(email, out var token) && token is not null)
        {
            return Results.Ok(new { token });
        }

        return Results.NotFound();
    })
    .AllowAnonymous()
    .WithTags("Dev");

    // Herramienta local para obtener el token de cambio de correo sin enviar correo real.
    app.MapGet("/api/v1/profile/dev/email-change-token", (string email, IDevEmailTokenStore store) =>
    {
        if (store.TryGetEmailChange(email, out var token) && token is not null)
        {
            return Results.Ok(new { token });
        }

        return Results.NotFound();
    })
    .AllowAnonymous()
    .WithTags("Dev");
}

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync();
        await DevelopmentDataSeeder.SeedAsync(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(
            ex,
            "No se pudieron sembrar datos de desarrollo. Verifique PostgreSQL y las migraciones.");
    }
}

static Task WriteProblemAsync(HttpContext context, int status, string code, string title, string detail)
{
    context.Response.StatusCode = status;
    context.Response.ContentType = "application/problem+json";

    var problem = new
    {
        type = $"https://dmgotravel.com/errors/{code}",
        title,
        status,
        code,
        traceId = Activity.Current?.Id ?? context.TraceIdentifier,
        detail,
        instance = context.Request.Path.Value
    };

    var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    });

    return context.Response.WriteAsync(json);
}

app.Run();

/// <summary>
/// Punto de entrada expuesto para las pruebas de integración con WebApplicationFactory.
/// </summary>
public partial class Program { }
