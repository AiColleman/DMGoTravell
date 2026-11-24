import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { isProblemDetails, ProblemDetailsError } from '../api/httpClient';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import {
  calculateNights24h,
  createIdempotencyKey,
  formatIfMatchHeader,
  formatPen,
  parseEtagVersion,
} from '../lib/format';
import App from '../App';

describe('DMGOTRAVEL Frontend — Reglas de Dominio y Contratos API', () => {
  it('formatea importes oficiales en Soles Peruanos (PEN) con dos decimales exactos', () => {
    expect(formatPen('1660.00')).toContain('1,660.00');
    expect(formatPen(119)).toContain('119.00');
    expect(formatPen(null)).toBe('S/ 0.00');
  });

  it('normaliza versiones ETag e If-Match conforme a concurrencia optimista DEC-220', () => {
    expect(parseEtagVersion('"v3"')).toBe(3);
    expect(parseEtagVersion('W/"5"')).toBe(5);
    expect(parseEtagVersion('"1"')).toBe(1);
    expect(parseEtagVersion(null)).toBeUndefined();
    expect(formatIfMatchHeader(4)).toBe('"v4"');
    expect(formatIfMatchHeader(undefined)).toBeUndefined();
  });

  it('calcula períodos completos de 24h para propuestas de alojamiento (Spec 007)', () => {
    expect(calculateNights24h('2026-12-18T15:00:00Z', '2026-12-20T15:00:00Z')).toBe(2);
    expect(calculateNights24h('2026-12-18T15:00:00Z', '2026-12-19T15:00:00Z')).toBe(1);
  });

  it('genera claves Idempotency-Key opacas únicas', () => {
    const keyA = createIdempotencyKey();
    const keyB = createIdempotencyKey();
    expect(keyA.length).toBeGreaterThanOrEqual(16);
    expect(keyA).not.toBe(keyB);
  });

  it('reconoce y encapsula errores RFC 7807 ProblemDetails del backend', () => {
    const payload = {
      type: 'https://dmgotravel.com/errors/payment_not_payable',
      title: 'Conflicto',
      status: 409,
      code: 'payment_not_payable',
      traceId: '00-abc123',
      detail: 'La reserva no admite un nuevo intento de pago.',
    };
    expect(isProblemDetails(payload)).toBe(true);
    const error = new ProblemDetailsError(payload);
    expect(error.problem.code).toBe('payment_not_payable');
    expect(error.message).toContain('nuevo intento de pago');
  });

  it('renderiza únicamente etiquetas autorizadas para los 4 estados comerciales de reserva', () => {
    const { rerender } = render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();

    rerender(<StatusBadge status="confirmed" />);
    expect(screen.getByText('Confirmada')).toBeInTheDocument();

    rerender(<StatusBadge status="completed" />);
    expect(screen.getByText('Completada')).toBeInTheDocument();

    rerender(<StatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('renderiza la Landing Page principal con el buscador y la sección de Movilidad Informativa', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        /Experiencias auténticas en los Andes con disponibilidad real garantizada/i
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Aguas Turquesas de Millpu & Mirador de Cóndores/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Unidades Turísticas Equipadas para Rutas de Altitud/i)
    ).toBeInTheDocument();
  });
});
