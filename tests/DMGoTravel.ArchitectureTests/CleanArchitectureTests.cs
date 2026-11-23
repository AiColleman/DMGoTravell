using FluentAssertions;
using NetArchTest.Rules;
using Xunit;

namespace DMGoTravel.ArchitectureTests;

public class CleanArchitectureTests
{
    private const string DomainNamespace = "DMGoTravel.Domain";
    private const string ApplicationNamespace = "DMGoTravel.Application";
    private const string InfrastructureNamespace = "DMGoTravel.Infrastructure";
    private const string ApiNamespace = "DMGoTravel.Api";

    [Fact(DisplayName = "BT-01-A02: Domain no debe tener dependencias de Application, Infrastructure ni Api")]
    public void Domain_Should_Not_Have_Dependency_On_Other_Projects()
    {
        // Arrange
        var assembly = typeof(DMGoTravel.Domain.Common.Money).Assembly;

        var otherProjects = new[]
        {
            ApplicationNamespace,
            InfrastructureNamespace,
            ApiNamespace
        };

        // Act
        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(otherProjects)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue("El Dominio debe ser completamente independiente y puro sin dependencias de otras capas.");
    }

    [Fact(DisplayName = "BT-01-A03: Application no debe tener dependencias de Infrastructure ni Api")]
    public void Application_Should_Not_Have_Dependency_On_Infrastructure_Or_Api()
    {
        // Arrange
        var assembly = typeof(DMGoTravel.Application.DependencyInjection).Assembly;

        var forbiddenProjects = new[]
        {
            InfrastructureNamespace,
            ApiNamespace
        };

        // Act
        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOnAny(forbiddenProjects)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue("La capa de Application no puede depender de implementaciones concretas de Infrastructure ni de la capa Api.");
    }

    [Fact(DisplayName = "BT-01-A04: Infrastructure no debe tener dependencias de Api")]
    public void Infrastructure_Should_Not_Have_Dependency_On_Api()
    {
        // Arrange
        var assembly = typeof(DMGoTravel.Infrastructure.DependencyInjection).Assembly;

        // Act
        var result = Types.InAssembly(assembly)
            .ShouldNot()
            .HaveDependencyOn(ApiNamespace)
            .GetResult();

        // Assert
        result.IsSuccessful.Should().BeTrue("Infrastructure implementa puertos pero no puede depender de controladores o endpoints de Api.");
    }
}
