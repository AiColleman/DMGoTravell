using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Auth.Dtos;
using DMGoTravel.Domain.Modules.Identity;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.Google;

public sealed record GoogleLinkCommand(string Code, string State) : IRequest<OperationResultDto>;

public sealed class GoogleLinkCommandHandler : IRequestHandler<GoogleLinkCommand, OperationResultDto>
{
    private readonly IGoogleOAuthService _googleOAuth;
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public GoogleLinkCommandHandler(
        IGoogleOAuthService googleOAuth,
        ICurrentUser currentUser,
        IUserRepository users,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _googleOAuth = googleOAuth;
        _currentUser = currentUser;
        _users = users;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationResultDto> Handle(
        GoogleLinkCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null || user.Status != UserStatus.Active)
        {
            throw new UnauthorizedAppException();
        }

        var exchange = await _googleOAuth.ExchangeCodeAsync(
            request.Code,
            request.State,
            cancellationToken);

        var googleEmailNormalized = exchange.User.Email.Trim().ToUpperInvariant();
        if (!string.Equals(user.NormalizedEmail, googleEmailNormalized, StringComparison.Ordinal))
        {
            throw new ConflictAppException(
                "google_email_mismatch",
                "El correo de la cuenta de Google seleccionada no coincide con el correo de tu cuenta DMGOTRAVEL.");
        }

        if (!user.IsEmailVerified)
        {
            user.VerifyEmail();
        }

        _audit.Record(new AuditEntry(
            AuditActions.GoogleLink,
            AuditActions.GoogleLink,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { provider = "google", linked = true })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationResultDto(user.PublicId, "linked", user.RowVersion);
    }
}
