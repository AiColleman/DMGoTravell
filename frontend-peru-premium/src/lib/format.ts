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
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
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
