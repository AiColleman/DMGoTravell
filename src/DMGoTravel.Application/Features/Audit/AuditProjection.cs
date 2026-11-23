using System.Globalization;
using System.Text.Json;
using DMGoTravel.Application.Common.Interfaces;
using DMGoTravel.Application.Features.Audit.Dtos;

namespace DMGoTravel.Application.Features.Audit;

/// <summary>
/// Proyección segura de auditoría. El resumen se deriva solo de claves conocidas
/// y no vuelca el JSON almacenado, evitando correos, tokens o identificadores de
/// familia de sesión aunque un registro antiguo contuviera datos adicionales.
/// </summary>
public static class AuditProjection
{
    private static readonly IReadOnlyDictionary<string, string> ActionLabels =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [AuditActions.Register] = "Registro de cuenta",
            [AuditActions.Login] = "Inicio de sesión",
            [AuditActions.Refresh] = "Renovación de sesión",
            [AuditActions.Logout] = "Cierre de sesión",
            [AuditActions.VerifyEmail] = "Verificación de correo",
            [AuditActions.ResendVerification] = "Reenvío de verificación",
            [AuditActions.ForgotPassword] = "Solicitud de recuperación de contraseña",
            [AuditActions.ResetPassword] = "Restablecimiento de contraseña",
            [AuditActions.ReservationCreate] = "Creación de reserva",
            [AuditActions.ReservationCancel] = "Cancelación de reserva",
            [AuditActions.ReservationAutoCancelled] = "Cancelación automática por vencimiento",
            [AuditActions.PaymentStart] = "Inicio de pago",
            [AuditActions.ProfileUpdate] = "Actualización de perfil",
            [AuditActions.ProfileRequestEmailChange] = "Solicitud de cambio de correo",
            [AuditActions.ProfileConfirmEmailChange] = "Confirmación de cambio de correo",
            [AuditActions.ProfileRequestClosure] = "Baja lógica de cuenta"
        };

    private static readonly IReadOnlyDictionary<string, string> ReasonLabels =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["invalid_credentials"] = "credenciales inválidas",
            ["email_not_verified"] = "correo no verificado",
            ["reuse_detected"] = "reutilización de sesión detectada"
        };

    public static AuditEntryDto ToDto(AuditRecordView record) =>
        new(
            record.PublicId,
            DateTime.SpecifyKind(record.OccurredAtUtc, DateTimeKind.Utc),
            FormatActor(record),
            record.EntityType,
            record.EntityId,
            record.Action,
            record.Result,
            record.CorrelationId,
            BuildSummary(record));

    private static string FormatActor(AuditRecordView record) =>
        record.ActorType switch
        {
            AuditActions.ActorHuman => record.ActorPublicId?.ToString() ?? AuditActions.ActorHuman,
            AuditActions.ActorSystem => AuditActions.ActorSystem,
            AuditActions.ActorUnidentified => AuditActions.ActorUnidentified,
            _ => record.ActorType
        };

    private static string BuildSummary(AuditRecordView record)
    {
        var label = ActionLabels.TryGetValue(record.Action, out var known)
            ? known
            : record.Action;

        var facts = ReadSafeFacts(record.ChangesJson);
        if (facts.Count > 0)
        {
            return $"{label}: {string.Join("; ", facts)}";
        }

        return record.Result == AuditActions.Failure ? $"{label} (fallo)" : label;
    }

    private static List<string> ReadSafeFacts(string? changesJson)
    {
        var facts = new List<string>();
        if (string.IsNullOrWhiteSpace(changesJson))
        {
            return facts;
        }

        try
        {
            using var document = JsonDocument.Parse(changesJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return facts;
            }

            foreach (var property in document.RootElement.EnumerateObject())
            {
                switch (property.Name)
                {
                    case "emailVerified" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("correo verificado");
                        break;
                    case "emailVerified" when property.Value.ValueKind is JsonValueKind.False:
                        facts.Add("correo no verificado");
                        break;
                    case "role" when property.Value.ValueKind is JsonValueKind.String &&
                                     property.Value.GetString() is "client" or "admin":
                        facts.Add($"rol registrado: {property.Value.GetString()}");
                        break;
                    case "sessionStarted" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("sesión iniciada");
                        break;
                    case "rotated" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("sesión renovada");
                        break;
                    case "reuseDetected" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("reutilización de sesión detectada");
                        break;
                    case "loggedOut" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("sesión cerrada");
                        break;
                    case "supersededPrevious" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("enlace anterior sustituido");
                        break;
                    case "resetRequested" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("recuperación solicitada");
                        break;
                    case "passwordChanged" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("contraseña cambiada");
                        break;
                    case "sessionsRevoked" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("sesiones revocadas");
                        break;
                    case "reason" when property.Value.ValueKind is JsonValueKind.String &&
                                       ReasonLabels.TryGetValue(
                                           property.Value.GetString() ?? string.Empty,
                                           out var reason):
                        facts.Add(reason);
                        break;
                    case "expiresAt" when property.Value.ValueKind is JsonValueKind.String &&
                                          DateTimeOffset.TryParse(
                                              property.Value.GetString(),
                                              CultureInfo.InvariantCulture,
                                              DateTimeStyles.AssumeUniversal,
                                              out var expiresAt):
                        facts.Add($"vigente hasta {expiresAt.UtcDateTime:yyyy-MM-ddTHH:mm:ssZ}");
                        break;
                    case "reservationNumber" when property.Value.ValueKind is JsonValueKind.String &&
                                                  IsSafeIdentifier(property.Value.GetString(), 32):
                        facts.Add($"reserva {property.Value.GetString()}");
                        break;
                    case "reservationId" when property.Value.ValueKind is JsonValueKind.String &&
                                              Guid.TryParse(property.Value.GetString(), out var reservationId):
                        facts.Add($"id reserva {reservationId}");
                        break;
                    case "departureId" when property.Value.ValueKind is JsonValueKind.String &&
                                            Guid.TryParse(property.Value.GetString(), out var departureId):
                        facts.Add($"salida {departureId}");
                        break;
                    case "previousStatus" when property.Value.ValueKind is JsonValueKind.String &&
                                               property.Value.GetString() is "pending" or "confirmed" or "completed" or "cancelled":
                        facts.Add($"estado anterior {property.Value.GetString()}");
                        break;
                    case "status" when property.Value.ValueKind is JsonValueKind.String &&
                                       property.Value.GetString() is "pending" or "confirmed" or "completed" or "cancelled":
                        facts.Add($"estado {property.Value.GetString()}");
                        break;
                    case "travelers" when property.Value.ValueKind is JsonValueKind.Number &&
                                          property.Value.TryGetInt32(out var travelers) &&
                                          travelers > 0:
                        facts.Add($"viajeros {travelers}");
                        break;
                    case "releasedSeats" when property.Value.ValueKind is JsonValueKind.Number &&
                                              property.Value.TryGetInt32(out var releasedSeats) &&
                                              releasedSeats >= 0:
                        facts.Add($"cupos liberados {releasedSeats}");
                        break;
                    case "cancellationOrigin" when property.Value.ValueKind is JsonValueKind.String &&
                                                   property.Value.GetString() is "client" or "admin" or "expiry" or "paymentreject" or "system":
                        facts.Add($"origen {property.Value.GetString()}");
                        break;
                    case "paymentStatus" when property.Value.ValueKind is JsonValueKind.String &&
                                              property.Value.GetString() is "created" or "sent" or "approved" or "rejected" or "unknown":
                        facts.Add($"pago {property.Value.GetString()}");
                        break;
                    case "reservationStatus" when property.Value.ValueKind is JsonValueKind.String &&
                                                  property.Value.GetString() is "pending" or "confirmed" or "completed" or "cancelled":
                        facts.Add($"estado reserva {property.Value.GetString()}");
                        break;
                    case "method" when property.Value.ValueKind is JsonValueKind.String &&
                                       property.Value.GetString() is "card" or "yape":
                        facts.Add($"método {property.Value.GetString()}");
                        break;
                    case "total" when property.Value.ValueKind is JsonValueKind.String &&
                                      decimal.TryParse(
                                          property.Value.GetString(),
                                          NumberStyles.Number,
                                          CultureInfo.InvariantCulture,
                                          out var totalAmount) &&
                                      totalAmount >= 0:
                        facts.Add($"total {totalAmount.ToString("0.00", CultureInfo.InvariantCulture)}");
                        break;
                    case "amount" when property.Value.ValueKind is JsonValueKind.String &&
                                       decimal.TryParse(
                                           property.Value.GetString(),
                                           NumberStyles.Number,
                                           CultureInfo.InvariantCulture,
                                           out var paymentAmount) &&
                                       paymentAmount >= 0:
                        facts.Add($"monto {paymentAmount.ToString("0.00", CultureInfo.InvariantCulture)}");
                        break;
                    case "currency" when property.Value.ValueKind is JsonValueKind.String &&
                                         property.Value.GetString() is "PEN":
                        facts.Add("moneda PEN");
                        break;
                    case "provider" when property.Value.ValueKind is JsonValueKind.String &&
                                         property.Value.GetString() is "simulated" or "culqi":
                        facts.Add($"proveedor {property.Value.GetString()}");
                        break;
                    case "providerReference" when property.Value.ValueKind is JsonValueKind.String &&
                                                  IsSafeIdentifier(property.Value.GetString(), 100):
                        facts.Add($"ref {property.Value.GetString()}");
                        break;
                    case "fullNameUpdated" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("nombre actualizado");
                        break;
                    case "phoneUpdated" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("teléfono actualizado");
                        break;
                    case "emailChangeRequested" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("cambio de correo solicitado");
                        break;
                    case "emailChanged" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("correo actualizado");
                        break;
                    case "accountClosed" when property.Value.ValueKind is JsonValueKind.True:
                        facts.Add("cuenta dada de baja");
                        break;
                    case "deadlineType" when property.Value.ValueKind is JsonValueKind.String &&
                                             property.Value.GetString() is "payment_deadline" or "validation_deadline":
                        facts.Add(property.Value.GetString() == "payment_deadline"
                            ? "límite de pago vencido"
                            : "límite de validación vencido");
                        break;
                }
            }
        }
        catch (JsonException)
        {
            // Un registro antiguo o corrupto no debe romper la consulta ni exponer su contenido.
        }

        return facts;
    }

    private static bool IsSafeIdentifier(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength)
        {
            return false;
        }

        foreach (var ch in value)
        {
            if (!char.IsLetterOrDigit(ch) && ch is not ('-' or '_'))
            {
                return false;
            }
        }

        return true;
    }
}
