import { endpoints, request } from '@/services/api';
import type { Hotel, Reservation, ReservationStatus, Tour, User } from '@/types/domain';

export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput { fullName: string; phone?: string }
export interface AuthSession { accessToken: string; tokenType: string; expiresIn: number; user: User }
export interface CreateReservationInput {
  departureId: string;
  travelers: number;
  lodging?: { proposalId: string; roomTypeId: string } | null;
}
export interface PaymentStartInput { method: 'card' | 'yape' }

export const authApi = {
  login: (body: LoginInput) => request<AuthSession>(`${endpoints.auth}/login`, { method: 'POST', body: JSON.stringify(body) }),
  register: (body: RegisterInput) => request<AuthSession>(`${endpoints.auth}/register`, { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>(`${endpoints.auth}/logout`, { method: 'POST', body: '{}' }),
  forgotPassword: (email: string) => request<{ id: string; status: string }>(`${endpoints.auth}/password/forgot`, { method: 'POST', body: JSON.stringify({ email }) }),
};

export const catalogApi = {
  tours: () => request<{ items: Tour[] }>(`${endpoints.catalog}/tours`),
  tour: (id: string) => request<Tour>(`${endpoints.catalog}/tours/${id}`),
  hotels: () => request<{ items: Hotel[] }>(endpoints.hotels),
  hotel: (id: string) => request<Hotel>(`${endpoints.hotels}/${id}`),
};

export const reservationApi = {
  create: (body: CreateReservationInput, idempotencyKey: string) => request<Reservation>(endpoints.reservations, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  }),
  mine: () => request<{ items: Reservation[] }>(endpoints.reservations),
  detail: (id: string) => request<Reservation>(`${endpoints.reservations}/${id}`),
  cancel: (id: string, version: number) => request<Reservation>(`${endpoints.reservations}/${id}/cancel`, { method: 'POST', body: JSON.stringify({ version }) }),
};

export const paymentApi = {
  start: (reservationId: string, body: PaymentStartInput, idempotencyKey: string) => request<{ id: string; status: string }>(`${endpoints.reservations}/${reservationId}/payments`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  }),
  detail: (paymentId: string) => request<{ id: string; status: string }>(`${endpoints.payments}/${paymentId}`),
};

export const adminApi = {
  reservations: (status?: ReservationStatus) => request<{ items: Reservation[] }>(`${endpoints.admin}/reservations${status ? `?status=${status}` : ''}`),
  completeReservation: (id: string, version: number) => request<Reservation>(`${endpoints.admin}/reservations/${id}/complete`, { method: 'POST', body: JSON.stringify({ version }) }),
  cancelReservation: (id: string, reason: string, version: number) => request<Reservation>(`${endpoints.admin}/reservations/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason, version }) }),
};
