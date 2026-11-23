using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using DMGoTravel.Application.Common.Exceptions;
using DMGoTravel.Application.Common.Idempotency;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Common.Validation;
using DMGoTravel.Application.Features.Reservations.Dtos;
using DMGoTravel.Domain.Common;
using DMGoTravel.Domain.Modules.Catalog;
using DMGoTravel.Domain.Modules.Reservations;
using FluentValidation;
using MediatR;

namespace DMGoTravel.Application.Features.Reservations.CreateReservation;

public sealed record CreateReservationCommand(
    Guid DepartureId,
    int Travelers,
    string IdempotencyKey,
    Guid? ProposalId = null,
    Guid? RoomTypeId = null) : IRequest<ReservationDto>, IIdempotentCommand
{
    public string IdempotencyScope => "reservations.create";

    public string GetRequestFingerprint() =>
        $"{DepartureId:N}|{Travelers}|{ProposalId?.ToString("N") ?? "-"}|{RoomTypeId?.ToString("N") ?? "-"}";
}

public sealed class CreateReservationCommandValidator : AbstractValidator<CreateReservationCommand>
{
    public CreateReservationCommandValidator()
    {
        RuleFor(command => command.DepartureId)
            .NotEmpty().WithMessage("La salida es obligatoria.");

        RuleFor(command => command.Travelers)
            .GreaterThanOrEqualTo(1).WithMessage("La cantidad de viajeros debe ser mayor a cero.");

        RuleFor(command => command.IdempotencyKey).ValidIdempotencyKey();

        RuleFor(command => command)
            .Must(command => command.ProposalId is null && command.RoomTypeId is null)
            .WithMessage("El alojamiento no está disponible en esta entrega.")
            .WithName("lodging");
    }
}

public sealed class CreateReservationCommandHandler : IRequestHandler<CreateReservationCommand, ReservationDto>
{
    private readonly ICurrentUser _currentUser;
    private readonly IUserRepository _users;
    private readonly IOfferRepository _offers;
    private readonly IReservationRepository _reservations;
    private readonly ReservationDtoFactory _dtoFactory;
    private readonly IDateTimeProvider _clock;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditWriter _audit;

    public CreateReservationCommandHandler(
        ICurrentUser currentUser,
        IUserRepository users,
        IOfferRepository offers,
        IReservationRepository reservations,
        ReservationDtoFactory dtoFactory,
        IDateTimeProvider clock,
        IUnitOfWork unitOfWork,
        IAuditWriter audit)
    {
        _currentUser = currentUser;
        _users = users;
        _offers = offers;
        _reservations = reservations;
        _dtoFactory = dtoFactory;
        _clock = clock;
        _unitOfWork = unitOfWork;
        _audit = audit;
    }

    public async Task<ReservationDto> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
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

        if (!user.IsEmailVerified)
        {
            throw new ForbiddenAppException(
                "email_not_verified",
                "El correo debe verificarse antes de reservar.");
        }

        var now = _clock.UtcNow;
        var departure = await _offers.GetDepartureByPublicIdAsync(request.DepartureId, cancellationToken);

        if (departure is null ||
            !departure.IsActive ||
            departure.StartsAtUtc <= now ||
            departure.AvailableCapacity < request.Travelers)
        {
            throw new ConflictAppException(
                "reservation_unavailable",
                "La salida no está disponible para la cantidad de viajeros solicitada.");
        }

        var offer = await _offers.GetByIdAsync(departure.OfferId, cancellationToken);
        if (offer is null || !offer.IsActive || offer.Type != OfferType.Tour)
        {
            throw new ConflictAppException(
                "reservation_unavailable",
                "La oferta no está disponible para reserva en esta entrega.");
        }

        var snapshot = new ReservationOfferSnapshot(
            offer.Type.ToString().ToLowerInvariant(),
            offer.Name,
            departure.StartsAtUtc,
            departure.EndsAtUtc,
            request.Travelers,
            departure.GetEffectivePrice(offer.PriceNormal));

        var hold = ReservationHold.CreateForTour(departure.Id, request.Travelers);
        var reservationNumber = await CreateUniqueReservationNumberAsync(cancellationToken);

        var reservation = Reservation.Create(
            reservationNumber,
            user.Id,
            departure.Id,
            offer.Id,
            snapshot,
            lodgingSnapshot: null,
            new[] { hold },
            now);

        try
        {
            departure.HoldSeats(request.Travelers);
        }
        catch (DomainException)
        {
            throw new ConflictAppException(
                "reservation_unavailable",
                "La salida no está disponible para la cantidad de viajeros solicitada.");
        }

        await _reservations.AddAsync(reservation, cancellationToken);

        _audit.Record(new AuditEntry(
            AuditActions.ReservationCreate,
            AuditActions.ReservationCreate,
            AuditActions.ActorHuman,
            user.Id,
            "reservation",
            reservation.PublicId.ToString(),
            AuditActions.Success,
            JsonSerializer.Serialize(new
            {
                reservationNumber = reservation.ReservationNumber,
                status = reservation.Status.ToString().ToLowerInvariant(),
                travelers = request.Travelers,
                total = reservation.Total.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                currency = reservation.Total.Currency,
                departureId = departure.PublicId
            })));

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (ConcurrencyConflictAppException)
        {
            throw new ConflictAppException(
                "reservation_unavailable",
                "La disponibilidad cambió mientras se creaba la reserva; vuelva a intentarlo.");
        }

        return await _dtoFactory.CreateAsync(reservation, cancellationToken);
    }

    private async Task<string> CreateUniqueReservationNumberAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var number = $"R-{RandomNumberGenerator.GetInt32(0, 100_000_000):D8}";
            if (!await _reservations.ReservationNumberExistsAsync(number, cancellationToken))
            {
                return number;
            }
        }

        throw new ConflictAppException(
            "reservation_unavailable",
            "No fue posible generar un número de reserva único; reintente.");
    }
}
