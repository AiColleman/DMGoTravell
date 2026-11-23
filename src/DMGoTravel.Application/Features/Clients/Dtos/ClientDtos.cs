using System.Text.Json.Serialization;

namespace DMGoTravel.Application.Features.Clients.Dtos;

/// <summary>
/// Resumen autorizado de un cliente. En una cuenta con baja lógica solo se
/// serializan el identificador, el estado y la cantidad de reservas; los
/// campos personales restantes se omiten.
/// </summary>
public sealed record ClientSummaryDto(
    Guid Id,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? FullName,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? Email,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? Phone,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    bool? EmailVerified,
    string Status,
    int ReservationCount,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    DateTime? RegisteredAt);

public sealed record ClientPageDto(
    int Page,
    int PageSize,
    int Total,
    bool HasNext,
    IReadOnlyList<ClientSummaryDto> Items);
