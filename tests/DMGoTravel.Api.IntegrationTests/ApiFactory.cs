using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Arranca la API en memoria con una base PostgreSQL dedicada a pruebas.
/// La base se recrea al inicio de cada ejecución para aislar los datos.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private const string TestDatabase = "dmgotravel_it";

    private const string AdminConnection =
        "Host=localhost;Port=5432;Database=postgres;Username=dmgotravel_user;Password=dmgotravel_password_2026";

    internal const string TestConnection =
        "Host=localhost;Port=5432;Database=dmgotravel_it;Username=dmgotravel_user;Password=dmgotravel_password_2026";

    public ApiFactory()
    {
        ResetDatabase();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:DefaultConnection", TestConnection);
    }

    private static void ResetDatabase()
    {
        using var connection = new NpgsqlConnection(AdminConnection);
        connection.Open();

        using (var drop = new NpgsqlCommand(
            $"DROP DATABASE IF EXISTS \"{TestDatabase}\" WITH (FORCE);",
            connection))
        {
            drop.ExecuteNonQuery();
        }

        using var create = new NpgsqlCommand(
            $"CREATE DATABASE \"{TestDatabase}\";",
            connection);
        create.ExecuteNonQuery();
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
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection",
            ApiFactory.TestConnection);
    }
}
