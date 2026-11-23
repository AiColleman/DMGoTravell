using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Payments.Dtos;
using DMGoTravel.Domain.Modules.Audit;
using DMGoTravel.Domain.Modules.Payments;
using DMGoTravel.Domain.Modules.Reservations;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace DMGoTravel.Application.Features.Payments.StartPayment;

public sealed record StartPaymentCommand(
    Guid ReservationId,
    string Method,
    string IdempotencyKey) : IRequest<PaymentStartResponseDto>, IIdempotentCommand
{
    public string IdempotencyScope => "payments.start";

    public string GetRequestFingerprint() =>
        $"{ReservationId:N}|{Method}";
}

public sealed class StartPaymentCommandValidator : AbstractValidator<StartPaymentCommand>
{
    public StartPaymentCommandValidator()
    {
        RuleFor(command => command.ReservationId)
            .NotEmpty().WithMessage("La reserva es obligatoria.");

        RuleFor(command => command.Method)
            .Must(method => PaymentMethod.All.Contains(method))
            .WithMessage("El método de pago debe ser card o yape.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();
    }
}

public sealed class StartPaymentCommandHandler : IRequestHandler<StartPaymentCommand, PaymentStartResponseDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IReservationRepository _reservations;
    private readonly IPaymentRepository _payments;
    private readonly IPaymentGateway _gateway;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;
    private readonly IPendingAuditRepository _pendingAudit;
    private readonly ICorrelationContext _correlation;
    private readonly ILogger<StartPaymentCommandHandler> _logger;

    public StartPaymentCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IReservationRepository reservations,
        IPaymentRepository payments,
        IPaymentGateway gateway,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit,
        IPendingAuditRepository pendingAudit,
        ICorrelationContext correlation,
        ILogger<StartPaymentCommandHandler> logger)
    {
        _currentUser = currentUser;
        _users = users;
        _reservations = reservations;
        _payments = payments;
        _gateway = gateway;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
        _pendingAudit = pendingAudit;
        _correlation = correlation;
        _logger = logger;
    }

    public async Task<PaymentStartResponseDto> Handle(StartPaymentCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedAppException();
        }

        var user = await _users.GetByPublicIdAsync(_currentUser.UserId.Value, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAppException();
        }

        var reservation = await _reservations.GetByPublicIdForAccountAsync(
            request.ReservationId,
            user.Id,
            cancellationToken);

        if (reservation is null)
        {
            throw new NotFoundAppException("La reserva no existe o no es accesible.");
        }

        var now = _clock.UtcNow;
        if (reservation.Status != ReservationStatus.Pending || now >= reservation.PaymentDeadlineAtUtc)
        {
            throw new ConflictAppException(
                "payment_not_payable",
                "La reserva no admite un nuevo intento de pago.");
        }

        var activeAttempt = await _payments.GetActiveByReservationIdAsync(reservation.Id, cancellationToken);
        if (activeAttempt is not null && activeAttempt.Status != PaymentStatus.Created)
        {
            return new PaymentStartResponseDto(
                PaymentMapper.ToDto(activeAttempt, reservation.PublicId),
                ProviderData: null);
        }

        PaymentAttempt attempt;
        if (activeAttempt is null)
        {
            attempt = new PaymentAttempt(
                reservation.Id,
                user.Id,
                request.Method,
                reservation.Total);

            await _payments.AddAsync(attempt, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Reintento de un intento que quedó creado antes de invocar al proveedor.
            attempt = activeAttempt;
        }

        var gatewayResult = await _gateway.ProcessAsync(
            new PaymentGatewayRequest(
                reservation.PublicId,
                reservation.Total.Amount,
                reservation.Total.Currency,
                attempt.Method),
            cancellationToken);

        attempt.MarkSent(gatewayResult.ProviderReference);

        if (gatewayResult.Approved)
        {
            attempt.MarkApproved();

            var external = new ExternalPayment(
                gatewayResult.ProviderReference,
                attempt.Id,
                reservation.Id,
                reservation.Total,
                gatewayResult.Status,
                now,
                gatewayResult.Provider);

            await _payments.AddExternalAsync(external, cancellationToken);
            reservation.ConfirmPayment(now);
        }
        else if (gatewayResult.Unknown)
        {
            attempt.MarkUnknown();
        }
        else
        {
            attempt.MarkRejected();
        }

        // Tras un resultado del proveedor externo, un fallo al anexar auditoría no debe
        // revertir el cobro ya aplicado ni provocar un segundo intento (010/RF-38-RF-41).
        var auditResult = gatewayResult.Approved ? AuditActions.Success : AuditActions.Failure;
        var auditChangesJson = JsonSerializer.Serialize(new
        {
            reservationId = reservation.PublicId,
            reservationNumber = reservation.ReservationNumber,
            paymentStatus = attempt.Status.ToString().ToLowerInvariant(),
            reservationStatus = reservation.Status.ToString().ToLowerInvariant(),
            method = attempt.Method,
            amount = reservation.Total.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            currency = reservation.Total.Currency,
            provider = gatewayResult.Provider,
            providerReference = gatewayResult.ProviderReference
        });

        try
        {
            _audit.Record(new AuditEntry(
                AuditActions.PaymentStart,
                AuditActions.PaymentStart,
                AuditActions.ActorHuman,
                user.Id,
                "payment",
                attempt.PublicId.ToString(),
                auditResult,
                auditChangesJson));
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Fallo al registrar auditoría tras resultado de pago externo; se encola para recuperación (010/RF-40). ReservationId={ReservationId}, PaymentId={PaymentId}, Status={PaymentStatus}, ProviderReference={ProviderReference}",
                reservation.PublicId,
                attempt.PublicId,
                attempt.Status,
                gatewayResult.ProviderReference);

            await _pendingAudit.AddAsync(
                PendingAuditEntry.Create(
                    "api",
                    AuditActions.PaymentStart,
                    AuditActions.ActorHuman,
                    user.Id,
                    AuditActions.PaymentStart,
                    "payment",
                    attempt.PublicId.ToString(),
                    now,
                    _correlation.CorrelationId,
                    auditResult,
                    auditChangesJson,
                    ex.Message,
                    now),
                cancellationToken);
        }

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (ConcurrencyConflictAppException)
        {
            throw new ConflictAppException(
                "payment_not_payable",
                "La reserva cambió mientras se procesaba el pago; consulte el estado antes de reintentar.");
        }

        return new PaymentStartResponseDto(
            PaymentMapper.ToDto(attempt, reservation.PublicId),
            new { providerReference = gatewayResult.ProviderReference });
    }
}
