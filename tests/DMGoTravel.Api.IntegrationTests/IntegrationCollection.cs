using Xunit;

namespace DMGoTravel.Api.IntegrationTests;

/// <summary>
/// Comparte una única instancia de la API y de la base de pruebas entre las clases
/// de integración, y evita que se ejecuten en paralelo sobre la misma base.
/// </summary>
[CollectionDefinition("Integration")]
public sealed class IntegrationCollection : ICollectionFixture<ApiFactory>;
