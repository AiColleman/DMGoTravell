/**
 * Formatea montos decimales exactos en Soles Peruanos (PEN).
 * Respeta la regla del proyecto: moneda oficial PEN, dos decimales exactos.
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
  // Soporta YYYY-MM-DD puro sin desplazamiento de zona
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

export function calculateNights24h(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 1;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/**
 * Genera una clave opaca Idempotency-Key segura sin datos personales ni secretos (DEC-220).
 */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Extrae el número de versión desde cabeceras ETag ("v2", W/"2", "2").
 */
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
