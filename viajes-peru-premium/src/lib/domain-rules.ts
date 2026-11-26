import type { ReservationStatus } from '@/types/domain';

export function canCustomerCancel(status: ReservationStatus): boolean {
  return status === 'pending';
}

export function canAdminComplete(status: ReservationStatus): boolean {
  return status === 'confirmed';
}

export function canAdminCancel(status: ReservationStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

// La confirmación comercial solo puede producirla el backend tras validar el pago.
export function canManuallyConfirm(_status: ReservationStatus): boolean {
  return false;
}
