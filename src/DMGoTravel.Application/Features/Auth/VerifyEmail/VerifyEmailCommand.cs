using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Security;
using DMGoTravel.Application.Features.Auth.Dtos;
using MediatR;

namespace DMGoTravel.Application.Features.Auth.VerifyEmail;

public sealed record VerifyEmailCommand(string Token) : IRequest<OperationResultDto>;

public sealed class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, OperationResultDto>
{
    private readonly IUserRepository _users;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public VerifyEmailCommandHandler(
        IUserRepository users,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _users = users;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<OperationResultDto> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.GetByEmailVerificationHashAsync(
            TokenGenerator.Hash(request.Token),
            cancellationToken);

        if (user is null)
        {
            throw new AppException(400, "invalid_token", "La prueba no es válida, venció o ya se usó.");
        }

        if (user.IsEmailVerified)
        {
            throw new ConflictAppException("already_verified", "La cuenta ya está verificada.");
        }

        if (user.EmailVerificationExpiresAtUtc is null || user.EmailVerificationExpiresAtUtc <= _clock.UtcNow)
        {
            throw new AppException(400, "invalid_token", "La prueba no es válida, venció o ya se usó.");
        }

        user.VerifyEmail();

        _audit.Record(new AuditEntry(
            AuditActions.VerifyEmail,
            AuditActions.VerifyEmail,
            AuditActions.ActorHuman,
            user.Id,
            "user_account",
            user.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new { emailVerified = true })));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OperationResultDto(user.PublicId, "verified", user.RowVersion);
    }
}
