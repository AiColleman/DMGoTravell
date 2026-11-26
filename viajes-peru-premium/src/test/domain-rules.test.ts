import { describe, expect, it } from 'vitest';
import { canAdminCancel, canAdminComplete, canCustomerCancel, canManuallyConfirm } from '@/lib/domain-rules';

describe('Reglas de estados de reserva', () => {
  it('permite al cliente cancelar únicamente una reserva pending', () => {
    expect(canCustomerCancel('pending')).toBe(true);
    expect(canCustomerCancel('confirmed')).toBe(false);
  });
  it('nunca permite confirmar manualmente una reserva pending', () => {
    expect(canManuallyConfirm('pending')).toBe(false);
  });
  it('permite completar solo reservas confirmed', () => {
    expect(canAdminComplete('confirmed')).toBe(true);
    expect(canAdminComplete('pending')).toBe(false);
  });
  it('limita la cancelación administrativa a reservas vigentes', () => {
    expect(canAdminCancel('pending')).toBe(true);
    expect(canAdminCancel('confirmed')).toBe(true);
    expect(canAdminCancel('completed')).toBe(false);
  });
});
