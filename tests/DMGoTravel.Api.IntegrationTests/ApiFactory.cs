using System.Runtime.CompilerServices;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Infrastructure.Integrations;
using DMGoTravel.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Arranca la API en memoria con una base PostgreSQL dedicada a pruebas.
/// La base se recrea al inicio de cada ejecución para aislar los datos.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private const string DefaultTestDatabase = "dmgotravel_it";

    private const string DefaultTestConnection =
        "Host=localhost;Port=5432;Database=dmgotravel_it;Username=dmgotravel_user;Password=dmgotravel_password_2026";

    internal static string TestConnection =>
        Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") is { Length: > 0 } envConn
            ? envConn
            : DefaultTestConnection;

    public ApiFactory()
    {
        ResetDatabase();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:DefaultConnection", TestConnection);
        builder.ConfigureServices(services =>
        {
            services.PostConfigure<ExternalProviderOptions>(options =>
            {
                // En pruebas de integración, forzar modo simulado para Resend para evitar llamadas de red a api.resend.com
                options.ResendApiKey = "";
            });
        });
    }

    /// <summary>
    /// Aísla cada prueba de integración limpiando las tablas de negocio, invalidando la caché
    /// descriptiva en memoria y re-sembrando los datos base deterministas (tour/paquete/usuarios).
    /// </summary>
    internal async Task ResetStateAsync(CancellationToken cancellationToken = default)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        const string truncateSql = """
            DO $$
            DECLARE
                stmt text;
            BEGIN
                SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' RESTART IDENTITY CASCADE;'
                INTO stmt
                FROM pg_tables
                WHERE schemaname = 'public' AND tablename <> '__EFMigrationsHistory';

                IF stmt IS NOT NULL THEN
                    EXECUTE stmt;
                END IF;
            END $$;
            """;

        await db.Database.ExecuteSqlRawAsync(truncateSql, cancellationToken);
        await DevelopmentDataSeeder.SeedAsync(
            scope.ServiceProvider,
            cancellationToken,
            includeOfficialHotelsCatalog: false);

        var cacheInvalidator = scope.ServiceProvider.GetService<ICacheInvalidator>();
        cacheInvalidator?.InvalidateCatalog();
        cacheInvalidator?.InvalidateMobility();
    }

    private static void ResetDatabase()
    {
        NpgsqlConnection.ClearAllPools();

        var targetBuilder = new NpgsqlConnectionStringBuilder(TestConnection);
        var targetDatabase = string.IsNullOrWhiteSpace(targetBuilder.Database)
            ? DefaultTestDatabase
            : targetBuilder.Database;

        var adminCandidates = new[]
        {
            Environment.GetEnvironmentVariable("POSTGRES_DB"),
            "postgres",
            "dmgotravel_dev"
        }
        .Where(db => !string.IsNullOrWhiteSpace(db) && !string.Equals(db, targetDatabase, StringComparison.OrdinalIgnoreCase))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();

        NpgsqlConnection? connection = null;
        Exception? lastError = null;
        foreach (var adminDb in adminCandidates)
        {
            var adminBuilder = new NpgsqlConnectionStringBuilder(TestConnection)
            {
                Database = adminDb
            };
            var candidate = new NpgsqlConnection(adminBuilder.ConnectionString);
            try
            {
                candidate.Open();
                connection = candidate;
                break;
            }
            catch (Exception ex)
            {
                lastError = ex;
                candidate.Dispose();
            }
        }

        if (connection is null)
        {
            throw new InvalidOperationException(
                $"No se pudo conectar a PostgreSQL para recrear la base de pruebas '{targetDatabase}'.",
                lastError);
        }

        using (connection)
        {
            using (var drop = new NpgsqlCommand(
                $"DROP DATABASE IF EXISTS \"{targetDatabase}\" WITH (FORCE);",
                connection))
            {
                drop.ExecuteNonQuery();
            }

            using (var create = new NpgsqlCommand(
                $"CREATE DATABASE \"{targetDatabase}\";",
                connection))
            {
                create.ExecuteNonQuery();
            }
        }
    }
}

/// <summary>
/// Fija la conexión de pruebas antes de que el runner cargue la API. La configuración
/// de <see cref="WebApplicationFactory"/> llega después de que Program lee la cadena,
/// por lo que la variable de entorno es la única vía fiable de aislamiento.
/// </summary>
internal static class TestEnvironment
{
    [ModuleInitializer]
    internal static void Initialize()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")))
        {
            Environment.SetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection",
                ApiFactory.TestConnection);
        }
    }
}
