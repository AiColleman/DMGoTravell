import crypto from 'node:crypto';

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ReservationTotals {
  touristSubtotal: number;
  lodgingSubtotal: number;
  total: number;
  currency: 'PEN';
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  traceId?: string;
}

export const PAYMENT_DEADLINE_MINUTES = 15;
export const VALIDATION_DEADLINE_MINUTES = 20;
export const MAX_IMAGE_BYTES = 5_000_000;

/**
 * Calcula totales de reserva con redondeo a 2 decimales en moneda PEN (Spec 001 / 007).
 */
export function calculateReservationTotals(
  unitOfferPrice: number,
  travelers: number,
  nightlyRoomRate = 0,
  nights = 0
): ReservationTotals {
  if (unitOfferPrice <= 0) {
    throw new Error('El precio unitario de la oferta debe ser mayor a cero.');
  }
  if (!Number.isInteger(travelers) || travelers <= 0) {
    throw new Error('La cantidad de viajeros debe ser un entero mayor a cero.');
  }
  if (nightlyRoomRate < 0 || !Number.isInteger(nights) || nights < 0) {
    throw new Error('Los parámetros de alojamiento no son válidos.');
  }

  const touristSubtotal = roundPen(unitOfferPrice * travelers);
  const lodgingSubtotal = roundPen(nightlyRoomRate * nights);
  return {
    touristSubtotal,
    lodgingSubtotal,
    total: roundPen(touristSubtotal + lodgingSubtotal),
    currency: 'PEN'
  };
}

export function roundPen(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Reglas de transición de estado de reserva (Spec 001 / 003 / 009).
 */
export function canTransitionReservation(
  current: ReservationStatus,
  target: ReservationStatus,
  actor: 'client' | 'admin' | 'payment' | 'system'
): boolean {
  if (current === 'pending' && target === 'confirmed') {
    // Regla fundamental: SOLO el pago validado confirma una reserva; el admin jamás sustituye el pago.
    return actor === 'payment';
  }
  if (current === 'pending' && target === 'cancelled') {
    return actor === 'client' || actor === 'system';
  }
  if (current === 'confirmed' && target === 'cancelled') {
    return actor === 'admin';
  }
  if (current === 'confirmed' && target === 'completed') {
    return actor === 'admin';
  }
  return false;
}

/**
 * Evalúa vencimiento automático de reserva pending (Spec 003):
 * 15 min sin pago en curso, o 20 min si existe intento oportuno en validación.
 */
export function isReservationExpired(
  createdAtUtc: Date,
  nowUtc: Date,
  hasTimelyPaymentInProgress: boolean
): boolean {
  const deadlineMinutes = hasTimelyPaymentInProgress
    ? VALIDATION_DEADLINE_MINUTES
    : PAYMENT_DEADLINE_MINUTES;
  const deadlineMs = createdAtUtc.getTime() + deadlineMinutes * 60_000;
  return nowUtc.getTime() >= deadlineMs;
}

/**
 * Enmascara correo electrónico para incidentes de notificación y auditoría (Spec 004 / 010).
 */
export function maskRecipientEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return '***';
  }
  const [local, domain] = parts;
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

/**
 * Valida magic bytes reales y tamaño <= 5 MB para JPG, PNG y WebP (Spec 012).
 */
export function detectAllowedImageMime(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    return null;
  }
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Firma y verificación HMAC-SHA256 para webhook Culqi (Spec 002 / AC04).
 */
export function signCulqiWebhook(secret: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function verifyCulqiWebhookSignature(secret: string, rawBody: string, signature: string): boolean {
  if (!secret || !signature) {
    return false;
  }
  const normalized = signature.replace(/^sha256=/i, '').trim().toLowerCase();
  const expected = signCulqiWebhook(secret, rawBody);
  const a = Buffer.from(normalized, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Valida que una respuesta de error cumpla el contrato RFC 7807 ProblemDetails (ADR-016 / AC08).
 */
export function isValidProblemDetails(payload: unknown): payload is ProblemDetails {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.type === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.status === 'number' &&
    typeof candidate.code === 'string' &&
    typeof candidate.detail === 'string'
  );
}
