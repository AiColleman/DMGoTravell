import type { CommercialReservationStatus } from '../types/api';

/**
 * Formatea montos decimales exactos en Soles Peruanos (PEN).
 */
export function formatPen(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'S/ 0.00';
  }
  const clean = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : String(value);
  const numeric = Number(clean);
  if (Number.isNaN(numeric)) {
    return `S/ ${value}`;
  }
  return `S/ ${numeric.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const clean = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : String(value);
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formatea un instante ISO en zona horaria comercial America/Lima (UTC-5).
 */
export function formatLimaDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatLimaDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    const local = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(local);
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function todayLimaIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Extrae la fecha calendario YYYY-MM-DD en zona horaria America/Lima (UTC-5).
 */
export function toLimaDateIso(iso: string | null | undefined): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatLimaTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatLimaWeekdayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00Z`)
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const formatted = new Intl.DateTimeFormat('es-PE', {
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(iso) ? 'UTC' : 'America/Lima',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(/\./g, '');
}

export type DepartureMatchKind =
  | 'exact-id'
  | 'exact-date'
  | 'nearest-after'
  | 'nearest-available'
  | 'recommended'
  | 'none';

export interface SmartDepartureCandidate {
  id: string;
  startDate: string;
  available?: number | null;
}

/**
 * Lógica inteligente de selección de salida (Spec 001 · RF-4, RF-6):
 * - Excluye salidas pasadas y ordena cronológicamente ascendente.
 * - Prioriza coincidencia exacta por ID o fecha deseada en hora Perú con cupos disponibles.
 * - Si la fecha elegida no opera o está agotada, sugiere la salida futura disponible más próxima.
 * - Por defecto selecciona la salida próxima con cupo suficiente para el grupo (o con cupo > 0).
 */
export function pickSmartDeparture<T extends SmartDepartureCandidate>(
  departures: readonly T[],
  options: {
    requestedDepartureId?: string | null;
    requestedDateIso?: string | null;
    travelers?: number;
    nowMs?: number;
  } = {}
): {
  departure: T | null;
  sortedFuture: T[];
  matchKind: DepartureMatchKind;
} {
  const nowMs = options.nowMs ?? Date.now();
  const travelers = Math.max(1, options.travelers ?? 1);

  const sortedFuture = [...departures]
    .filter((d) => {
      const ms = new Date(d.startDate).getTime();
      return Number.isFinite(ms) && ms > nowMs;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const hasSeats = (d: T) => d.available === null || d.available === undefined || d.available > 0;
  const coversGroup = (d: T) =>
    d.available === null || d.available === undefined || d.available >= travelers;

  const bookable = sortedFuture.filter(hasSeats);
  if (bookable.length === 0) {
    return {
      departure: sortedFuture[0] ?? null,
      sortedFuture,
      matchKind: 'none',
    };
  }

  if (options.requestedDepartureId) {
    const byId = bookable.find((d) => d.id === options.requestedDepartureId);
    if (byId) {
      return { departure: byId, sortedFuture, matchKind: 'exact-id' };
    }
  }

  const targetDate = options.requestedDateIso?.trim();
  if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    const sameDayWithGroup = bookable.find(
      (d) => toLimaDateIso(d.startDate) === targetDate && coversGroup(d)
    );
    if (sameDayWithGroup) {
      return { departure: sameDayWithGroup, sortedFuture, matchKind: 'exact-date' };
    }

    const sameDayAny = bookable.find((d) => toLimaDateIso(d.startDate) === targetDate);
    if (sameDayAny) {
      return { departure: sameDayAny, sortedFuture, matchKind: 'exact-date' };
    }

    const nextAvailable =
      bookable.find((d) => toLimaDateIso(d.startDate) >= targetDate && coversGroup(d)) ??
      bookable.find((d) => toLimaDateIso(d.startDate) >= targetDate);
    if (nextAvailable) {
      return { departure: nextAvailable, sortedFuture, matchKind: 'nearest-after' };
    }

    return {
      departure: bookable[bookable.length - 1]!,
      sortedFuture,
      matchKind: 'nearest-available',
    };
  }

  const recommended = bookable.find(coversGroup) ?? bookable[0]!;
  return { departure: recommended, sortedFuture, matchKind: 'recommended' };
}

export function calculateNights24h(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 1;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function parseEtagVersion(etagHeader: string | null | undefined): number | undefined {
  if (!etagHeader) return undefined;
  let cleaned = etagHeader.trim();
  if (cleaned.toUpperCase().startsWith('W/')) {
    cleaned = cleaned.slice(2).trim();
  }
  cleaned = cleaned.replace(/^"+|"+$/g, '');
  if (cleaned.startsWith('v') || cleaned.startsWith('V')) {
    cleaned = cleaned.slice(1);
  }
  const version = Number.parseInt(cleaned, 10);
  return Number.isFinite(version) && version >= 1 ? version : undefined;
}

export function formatIfMatchHeader(version: number | undefined | null): string | undefined {
  if (version === undefined || version === null || version < 1) return undefined;
  return `"v${version}"`;
}

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const entry of cookies) {
    const idx = entry.indexOf('=');
    if (idx <= 0) continue;
    const key = entry.slice(0, idx);
    if (key === name) {
      return decodeURIComponent(entry.slice(idx + 1));
    }
  }
  return null;
}

// ============================================================================
// Reglas invariantes de dominio de reservas (RN-14 / RN-19 / RN-24)
// ============================================================================

export function canCustomerCancel(status: CommercialReservationStatus | string): boolean {
  return status.toLowerCase() === 'pending';
}

export function canAdminComplete(status: CommercialReservationStatus | string): boolean {
  return status.toLowerCase() === 'confirmed';
}

/**
 * Spec 009 (RF-8, RF-9, DEC-149): el administrador solo puede cancelar reservas `confirmed`
 * antes del inicio del servicio (con motivo obligatorio y apertura de devolución total).
 * Jamás puede confirmar ni cancelar manualmente una reserva `pending`.
 */
export function canAdminCancel(status: CommercialReservationStatus | string): boolean {
  return status.toLowerCase() === 'confirmed';
}

/**
 * La confirmación comercial (pending -> confirmed) jamás puede ejecutarse manualmente:
 * solo la produce el backend tras validar un pago exitoso en Culqi.
 */
export function canManuallyConfirm(_status: CommercialReservationStatus | string): boolean {
  return false;
}
