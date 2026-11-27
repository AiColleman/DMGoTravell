using DMGoTravel.Application.Common.Behaviors;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Notifications;
using DMGoTravel.Application.Features.Reservations;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace DMGoTravel.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
        });

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(IdempotencyBehavior<,>));

        foreach (var type in assembly.GetTypes().Where(type => !type.IsAbstract && !type.IsInterface))
        {
            var validatorContracts = type
                .GetInterfaces()
                .Where(contract => contract.IsGenericType &&
                                   contract.GetGenericTypeDefinition() == typeof(IValidator<>));

            foreach (var contract in validatorContracts)
            {
                services.AddTransient(contract, type);
            }
        }

        services.AddTransient<ReservationDtoFactory>();
        services.AddScoped<IAdminAccessGuard, AdminAccessGuard>();
        services.AddScoped<IReservationEmailNotifier, ReservationEmailNotifier>();

        return services;
    }
}
