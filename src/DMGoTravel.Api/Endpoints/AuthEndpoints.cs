using DMGoTravel.Api.Auth;
using DMGoTravel.Api.Contracts;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Features.Auth.ForgotPassword;
using DMGoTravel.Application.Features.Auth.Login;
using DMGoTravel.Application.Features.Auth.Logout;
using DMGoTravel.Application.Features.Auth.Refresh;
using DMGoTravel.Application.Features.Auth.Register;
using DMGoTravel.Application.Features.Auth.ResendVerification;
using DMGoTravel.Application.Features.Auth.ResetPassword;
using DMGoTravel.Application.Features.Auth.VerifyEmail;
using MediatR;

namespace DMGoTravel.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").WithTags("Auth");

        group.MapPost("/register", async (
            RegisterRequest request,
            IMediator mediator,
            HttpContext context,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new RegisterCommand(request.Email, request.Password, request.FullName, request.Phone),
                cancellationToken);

            AuthCookies.Write(context, result, secure: !environment.IsDevelopment());
            return Results.Created("/api/v1/profile", result.Session);
        })
        .AllowAnonymous();

        group.MapPost("/login", async (
            LoginRequest request,
            IMediator mediator,
            HttpContext context,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new LoginCommand(request.Email, request.Password),
                cancellationToken);

            AuthCookies.Write(context, result, secure: !environment.IsDevelopment());
            return Results.Ok(result.Session);
        })
        .AllowAnonymous();

        group.MapPost("/refresh", async (
            IMediator mediator,
            HttpContext context,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            if (!AuthCookies.HasValidCsrf(context))
            {
                throw new UnauthorizedAppException("Falta la prueba CSRF o no coincide.");
            }

            var rawRefresh = context.Request.Cookies[AuthCookies.RefreshCookie];
            if (string.IsNullOrWhiteSpace(rawRefresh))
            {
                throw new UnauthorizedAppException();
            }

            var result = await mediator.Send(new RefreshCommand(rawRefresh), cancellationToken);
            AuthCookies.Write(context, result, secure: !environment.IsDevelopment());
            return Results.Ok(result.Session);
        })
        .AllowAnonymous();

        group.MapPost("/logout", async (
            IMediator mediator,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            if (AuthCookies.HasValidCsrf(context))
            {
                var rawRefresh = context.Request.Cookies[AuthCookies.RefreshCookie];
                await mediator.Send(new LogoutCommand(rawRefresh), cancellationToken);
            }

            AuthCookies.Clear(context);
            return Results.NoContent();
        })
        .RequireAuthorization();

        group.MapPost("/verify-email", async (
            VerifyEmailRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new VerifyEmailCommand(request.Token), cancellationToken);
            return Results.Ok(result);
        })
        .AllowAnonymous();

        group.MapPost("/verify-email/resend", async (
            HttpContext httpContext,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ResendVerificationCommand(IdempotencyHeader.Read(httpContext)),
                cancellationToken);

            return Results.Accepted(value: result);
        })
        .RequireAuthorization();

        group.MapPost("/password/forgot", async (
            ForgotPasswordRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new ForgotPasswordCommand(request.Email), cancellationToken);
            return Results.Accepted(value: result);
        })
        .AllowAnonymous();

        group.MapPost("/password/reset", async (
            ResetPasswordRequest request,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new ResetPasswordCommand(request.Token, request.NewPassword),
                cancellationToken);

            return Results.Ok(result);
        })
        .AllowAnonymous();

        return app;
    }
}
