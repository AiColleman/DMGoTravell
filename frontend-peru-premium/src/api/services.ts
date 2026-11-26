import {
  downloadAuthenticatedBlob,
  requestJson,
  requestWithMeta,
  type HttpResult,
} from './httpClient';
import type {
  AdminReservationDto,
  AdminReservationPageDto,
  AuditEntryDto,
  AuditPageDto,
  AuthSessionDto,
  CatalogAdminItemDto,
  CatalogAdminPageDto,
  CatalogApiType,
  CatalogFilterParams,
  CatalogListDto,
  CatalogOfferDetailDto,
  ClientPageDto,
  ClientSummaryDto,
  CreateReservationRequest,
  DepartureDto,
  ExportAcceptedDto,
  ExportJobDto,
  HealthResponse,
  HotelAdminItemDto,
  HotelAdminPageDto,
  HotelPublicDetailDto,
  HotelPublicListDto,
  ImageAssetDto,
  InventoryRowDto,
  LodgingProposalDto,
  LodgingProposalListDto,
  LoginRequest,
  MobilityAdminItemDto,
  MobilityAdminPageDto,
  MobilityPublicListDto,
  NotificationIncidentDto,
  NotificationIncidentPageDto,
  OperationAcceptedDto,
  OperationResultDto,
  PaymentAttemptDto,
  PaymentMethodType,
  PaymentStartResponseDto,
  ProfileDto,
  RefundCaseDto,
  RefundCasePageDto,
  RegisterRequest,
  ReportDetailDto,
  ReportRowPageDto,
  ReservationDto,
  ReservationPageDto,
  RoomTypeDto,
} from '../types/api';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const systemApi = {
  health: () => requestJson<HealthResponse>('/health'),
};

export const authApi = {
  register: (payload: RegisterRequest) =>
    requestJson<AuthSessionDto>('/api/v1/auth/register', {
      method: 'POST',
      body: payload,
      idempotent: true,
    }),

  login: (payload: LoginRequest) =>
    requestJson<AuthSessionDto>('/api/v1/auth/login', {
      method: 'POST',
      body: payload,
    }),

  refresh: () =>
    requestJson<AuthSessionDto>('/api/v1/auth/refresh', {
      method: 'POST',
      includeCsrf: true,
    }),

  logout: () =>
    requestJson<void>('/api/v1/auth/logout', {
      method: 'POST',
      auth: true,
      includeCsrf: true,
    }),

  verifyEmail: (token: string) =>
    requestJson<OperationResultDto>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: { token },
    }),

  resendVerification: () =>
    requestJson<OperationAcceptedDto>('/api/v1/auth/verify-email/resend', {
      method: 'POST',
      auth: true,
      body: {},
      idempotent: true,
    }),

  forgotPassword: (email: string) =>
    requestJson<OperationAcceptedDto>('/api/v1/auth/password/forgot', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token: string, newPassword: string) =>
    requestJson<OperationResultDto>('/api/v1/auth/password/reset', {
      method: 'POST',
      body: { token, newPassword },
    }),

  devGetVerificationToken: (email: string) =>
    requestJson<{ token: string }>(
      `/api/v1/auth/dev/verification-token${buildQuery({ email })}`
    ),

  devGetPasswordResetToken: (email: string) =>
    requestJson<{ token: string }>(
      `/api/v1/auth/dev/password-reset-token${buildQuery({ email })}`
    ),

  getGoogleStartUrl: (returnTo?: string): string => {
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const startPath =
      import.meta.env.VITE_GOOGLE_OAUTH_START_URL ||
      import.meta.env.VITE_GOOGLE_OAUTH_URL ||
      '/api/v1/auth/google/start';
    const full = startPath.startsWith('http') ? startPath : `${base}${startPath}`;
    if (!returnTo) return full;
    const sep = full.includes('?') ? '&' : '?';
    return `${full}${sep}returnUrl=${encodeURIComponent(returnTo)}`;
  },

  googleCallback: (code: string, state: string) =>
    requestJson<AuthSessionDto>(`/api/v1/auth/google/callback${buildQuery({ code, state })}`),

  googleLink: (code: string, state: string) =>
    requestJson<OperationResultDto>('/api/v1/auth/google/link', {
      method: 'POST',
      auth: true,
      body: { code, state },
      idempotent: true,
    }),
};

export const profileApi = {
  getProfile: (): Promise<HttpResult<ProfileDto>> =>
    requestWithMeta<ProfileDto>('/api/v1/profile', {
      method: 'GET',
      auth: true,
    }),

  updateProfile: (
    payload: { fullName?: string; phone?: string | null },
    ifMatchVersion?: number | null
  ): Promise<HttpResult<ProfileDto>> =>
    requestWithMeta<ProfileDto>('/api/v1/profile', {
      method: 'PUT',
      auth: true,
      body: payload,
      ifMatchVersion,
    }),

  requestEmailChange: (newEmail: string, currentPassword?: string) =>
    requestJson<OperationAcceptedDto>('/api/v1/profile/email-change', {
      method: 'POST',
      auth: true,
      body: { newEmail, currentPassword },
      idempotent: true,
    }),

  confirmEmailChange: (token: string) =>
    requestJson<OperationResultDto>('/api/v1/profile/email-change/confirm', {
      method: 'POST',
      body: { token },
    }),

  requestClosure: (confirm: boolean) =>
    requestJson<OperationResultDto>('/api/v1/profile/closure', {
      method: 'POST',
      auth: true,
      body: { confirm },
      idempotent: true,
    }),

  devGetEmailChangeToken: (email: string) =>
    requestJson<{ token: string }>(
      `/api/v1/profile/dev/email-change-token${buildQuery({ email })}`
    ),
};

function formatCatalogMoneyParam(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return undefined;
  return num.toFixed(2);
}

export const catalogApi = {
  list: (type: CatalogApiType, filters: CatalogFilterParams = {}) =>
    requestJson<CatalogListDto>(
      `/api/v1/catalog/${type}${buildQuery({
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 9,
        priceMin: formatCatalogMoneyParam(filters.priceMin),
        priceMax: formatCatalogMoneyParam(filters.priceMax),
        durationMin: filters.durationMin,
        durationMax: filters.durationMax,
        startDate: filters.startDate,
        endDate: filters.endDate,
        destination: filters.destination,
      })}`
    ),

  getDetail: (type: CatalogApiType, id: string) =>
    requestJson<CatalogOfferDetailDto>(`/api/v1/catalog/${type}/${id}`),
};

export const hotelsApi = {
  listPublic: () => requestJson<HotelPublicListDto>('/api/v1/hotels'),
  getPublicDetail: (id: string) => requestJson<HotelPublicDetailDto>(`/api/v1/hotels/${id}`),
  listByDeparture: (departureId: string) =>
    requestJson<LodgingProposalListDto>(`/api/v1/departures/${departureId}/lodging`),
};

export const mobilityApi = {
  listPublic: () => requestJson<MobilityPublicListDto>('/api/v1/mobility'),
};

export const reservationsApi = {
  create: (payload: CreateReservationRequest, idempotencyKey?: string) =>
    requestJson<ReservationDto>('/api/v1/reservations', {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
      idempotencyKey,
    }),

  listMine: (page = 1, pageSize = 10) =>
    requestJson<ReservationPageDto>(
      `/api/v1/reservations${buildQuery({ page, pageSize })}`,
      { auth: true }
    ),

  getById: (id: string) =>
    requestJson<ReservationDto>(`/api/v1/reservations/${id}`, { auth: true }),

  cancel: (id: string, version?: number) =>
    requestJson<ReservationDto>(`/api/v1/reservations/${id}/cancel`, {
      method: 'POST',
      auth: true,
      body: version !== undefined ? { version } : {},
      idempotent: true,
      ifMatchVersion: version,
    }),
};

export const paymentsApi = {
  startPayment: (reservationId: string, method: PaymentMethodType, idempotencyKey?: string) =>
    requestJson<PaymentStartResponseDto>(`/api/v1/reservations/${reservationId}/payments`, {
      method: 'POST',
      auth: true,
      body: { method },
      idempotent: true,
      idempotencyKey,
    }),

  getPayment: (paymentId: string) =>
    requestJson<PaymentAttemptDto>(`/api/v1/payments/${paymentId}`, {
      auth: true,
    }),
};

export const adminApi = {
  listCatalog: (type: CatalogApiType, page = 1, pageSize = 10) =>
    requestJson<CatalogAdminPageDto>(
      `/api/v1/admin/catalog/${type}${buildQuery({ page, pageSize })}`,
      { auth: true }
    ),

  createOffer: (
    type: CatalogApiType,
    payload: {
      name: string;
      description: string;
      price: string;
      durationDays: number;
      conditions: string[];
      itinerary: Array<{ day: number; title: string; description: string }>;
    }
  ) =>
    requestJson<CatalogAdminItemDto>(`/api/v1/admin/catalog/${type}`, {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
    }),

  activateOffer: (type: CatalogApiType, id: string, version: number) =>
    requestJson<CatalogAdminItemDto>(`/api/v1/admin/catalog/${type}/${id}/activate`, {
      method: 'POST',
      auth: true,
      ifMatchVersion: version,
    }),

  deactivateOffer: (type: CatalogApiType, id: string, version: number) =>
    requestJson<CatalogAdminItemDto>(`/api/v1/admin/catalog/${type}/${id}/deactivate`, {
      method: 'POST',
      auth: true,
      ifMatchVersion: version,
    }),

  updateOfferPricing: (
    type: CatalogApiType,
    id: string,
    normalPrice: string,
    discountedPrice: string | null,
    version: number
  ) =>
    requestJson<CatalogAdminItemDto>(`/api/v1/admin/catalog/${type}/${id}/pricing`, {
      method: 'PUT',
      auth: true,
      body: { normalPrice, discountedPrice: discountedPrice || null },
      ifMatchVersion: version,
    }),

  createDeparture: (
    type: CatalogApiType,
    offerId: string,
    payload: { startDate: string; endDate: string; price: string; capacity: number }
  ) =>
    requestJson<DepartureDto>(`/api/v1/admin/catalog/${type}/${offerId}/departures`, {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
    }),

  uploadOfferImage: (type: CatalogApiType, offerId: string, file: File, isPrimary: boolean) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('isPrimary', String(isPrimary));
    return requestJson<ImageAssetDto>(`/api/v1/admin/catalog/${type}/${offerId}/images`, {
      method: 'POST',
      auth: true,
      formData: fd,
    });
  },

  listHotels: (page = 1, pageSize = 50) =>
    requestJson<HotelAdminPageDto>(
      `/api/v1/admin/hotels${buildQuery({ page, pageSize })}`,
      { auth: true }
    ),

  createHotel: (payload: { name: string; description: string; services: string[] }) =>
    requestJson<HotelAdminItemDto>('/api/v1/admin/hotels', {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
    }),

  updateHotel: (
    id: string,
    payload: { name: string; description: string; services: string[] },
    ifMatchVersion?: number
  ) =>
    requestJson<HotelAdminItemDto>(`/api/v1/admin/hotels/${id}`, {
      method: 'PUT',
      auth: true,
      body: payload,
      ifMatchVersion,
    }),

  activateHotel: (id: string, version: number) =>
    requestJson<HotelAdminItemDto>(`/api/v1/admin/hotels/${id}/activate`, {
      method: 'POST',
      auth: true,
      ifMatchVersion: version,
    }),

  deactivateHotel: (id: string, version: number) =>
    requestJson<HotelAdminItemDto>(`/api/v1/admin/hotels/${id}/deactivate`, {
      method: 'POST',
      auth: true,
      ifMatchVersion: version,
    }),

  createRoomType: (
    hotelId: string,
    payload: { name: string; capacity: number; basePrice: string }
  ) =>
    requestJson<RoomTypeDto>(`/api/v1/admin/hotels/${hotelId}/room-types`, {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
    }),

  updateRoomType: (
    hotelId: string,
    roomTypeId: string,
    payload: { name: string; capacity: number; basePrice: string },
    ifMatchVersion?: number
  ) =>
    requestJson<RoomTypeDto>(`/api/v1/admin/hotels/${hotelId}/room-types/${roomTypeId}`, {
      method: 'PUT',
      auth: true,
      body: payload,
      ifMatchVersion,
    }),

  updateRoomInventory: (
    roomTypeId: string,
    date: string,
    quantity: number,
    ifMatchVersion?: number
  ) =>
    requestJson<InventoryRowDto>(`/api/v1/admin/room-types/${roomTypeId}/inventory`, {
      method: 'PUT',
      auth: true,
      body: { date, quantity },
      ifMatchVersion,
    }),

  createLodgingProposal: (payload: {
    departureId: string;
    hotelId: string;
    startDate: string;
    endDate: string;
  }) =>
    requestJson<LodgingProposalDto>('/api/v1/admin/lodging-proposals', {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
    }),

  uploadHotelImage: (hotelId: string, file: File, isPrimary: boolean) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('isPrimary', String(isPrimary));
    return requestJson<ImageAssetDto>(`/api/v1/admin/hotels/${hotelId}/images`, {
      method: 'POST',
      auth: true,
      formData: fd,
    });
  },

  replaceHotelImage: (hotelId: string, imageId: string, file: File, isPrimary: boolean) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('isPrimary', String(isPrimary));
    return requestJson<ImageAssetDto>(`/api/v1/admin/hotels/${hotelId}/images/${imageId}`, {
      method: 'PUT',
      auth: true,
      formData: fd,
    });
  },

  deleteHotelImage: (hotelId: string, imageId: string) =>
    requestJson<void>(`/api/v1/admin/hotels/${hotelId}/images/${imageId}`, {
      method: 'DELETE',
      auth: true,
    }),

  uploadRoomTypeImage: (
    hotelId: string,
    roomTypeId: string,
    file: File,
    isPrimary: boolean
  ) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('isPrimary', String(isPrimary));
    return requestJson<ImageAssetDto>(
      `/api/v1/admin/hotels/${hotelId}/room-types/${roomTypeId}/images`,
      {
        method: 'POST',
        auth: true,
        formData: fd,
      }
    );
  },

  replaceRoomTypeImage: (
    hotelId: string,
    roomTypeId: string,
    imageId: string,
    file: File,
    isPrimary: boolean
  ) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('isPrimary', String(isPrimary));
    return requestJson<ImageAssetDto>(
      `/api/v1/admin/hotels/${hotelId}/room-types/${roomTypeId}/images/${imageId}`,
      {
        method: 'PUT',
        auth: true,
        formData: fd,
      }
    );
  },

  deleteRoomTypeImage: (hotelId: string, roomTypeId: string, imageId: string) =>
    requestJson<void>(
      `/api/v1/admin/hotels/${hotelId}/room-types/${roomTypeId}/images/${imageId}`,
      {
        method: 'DELETE',
        auth: true,
      }
    ),

  listMobility: (page = 1, pageSize = 10) =>
    requestJson<MobilityAdminPageDto>(
      `/api/v1/admin/mobility${buildQuery({ page, pageSize })}`,
      { auth: true }
    ),

  createMobility: (payload: {
    name: string;
    description: string;
    type: string;
    capacity: number;
  }) =>
    requestJson<MobilityAdminItemDto>('/api/v1/admin/mobility', {
      method: 'POST',
      auth: true,
      body: payload,
      idempotent: true,
    }),

  activateMobility: (id: string, version: number) =>
    requestJson<MobilityAdminItemDto>(`/api/v1/admin/mobility/${id}/activate`, {
      method: 'POST',
      auth: true,
      ifMatchVersion: version,
    }),

  deactivateMobility: (id: string, version: number) =>
    requestJson<MobilityAdminItemDto>(`/api/v1/admin/mobility/${id}/deactivate`, {
      method: 'POST',
      auth: true,
      ifMatchVersion: version,
    }),

  replaceMobilityImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('isPrimary', 'true');
    return requestJson<ImageAssetDto>(`/api/v1/admin/mobility/${id}/image`, {
      method: 'PUT',
      auth: true,
      formData: fd,
    });
  },

  listReservations: (filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    tourId?: string;
    hotelId?: string;
    reservationId?: string;
    clientEmail?: string;
  }) =>
    requestJson<AdminReservationPageDto>(
      `/api/v1/admin/reservations${buildQuery(filters)}`,
      { auth: true }
    ),

  getReservation: (id: string) =>
    requestJson<AdminReservationDto>(`/api/v1/admin/reservations/${id}`, { auth: true }),

  cancelReservation: (id: string, reason: string, version: number) =>
    requestJson<AdminReservationDto>(`/api/v1/admin/reservations/${id}/cancel`, {
      method: 'POST',
      auth: true,
      body: { reason, version },
      idempotent: true,
      ifMatchVersion: version,
    }),

  completeReservation: (id: string, version: number) =>
    requestJson<AdminReservationDto>(`/api/v1/admin/reservations/${id}/complete`, {
      method: 'POST',
      auth: true,
      body: { version },
      idempotent: true,
      ifMatchVersion: version,
    }),

  listRefundCases: (page = 1, pageSize = 10, status?: string) =>
    requestJson<RefundCasePageDto>(
      `/api/v1/admin/refund-cases${buildQuery({ page, pageSize, status })}`,
      { auth: true }
    ),

  authorizeRefund: (id: string, version: number) =>
    requestJson<RefundCaseDto>(`/api/v1/admin/refund-cases/${id}/authorize`, {
      method: 'POST',
      auth: true,
      body: { version },
      idempotent: true,
      ifMatchVersion: version,
    }),

  retryRefund: (id: string) =>
    requestJson<OperationAcceptedDto>(`/api/v1/admin/refund-cases/${id}/retry`, {
      method: 'POST',
      auth: true,
      idempotent: true,
    }),

  listNotificationIncidents: (page = 1, pageSize = 10, status?: string) =>
    requestJson<NotificationIncidentPageDto>(
      `/api/v1/admin/notification-incidents${buildQuery({ page, pageSize, status })}`,
      { auth: true }
    ),

  getNotificationIncident: (id: string) =>
    requestJson<NotificationIncidentDto>(`/api/v1/admin/notification-incidents/${id}`, {
      auth: true,
    }),

  resendNotificationDelivery: (deliveryId: string, reason?: string, version?: number) =>
    requestJson<OperationAcceptedDto>(
      `/api/v1/admin/notification-deliveries/${deliveryId}/resend`,
      {
        method: 'POST',
        auth: true,
        body: { reason, version },
        idempotent: true,
      }
    ),

  listClients: (filters: {
    page?: number;
    pageSize?: number;
    name?: string;
    email?: string;
    id?: string;
    status?: string;
    registeredFrom?: string;
    registeredTo?: string;
  }) =>
    requestJson<ClientPageDto>(`/api/v1/admin/clients${buildQuery(filters)}`, {
      auth: true,
    }),

  getClient: (id: string) =>
    requestJson<ClientSummaryDto>(`/api/v1/admin/clients/${id}`, { auth: true }),

  listAudit: (filters: {
    page?: number;
    pageSize?: number;
    from?: string;
    to?: string;
    actor?: string;
    entity?: string;
    correlationId?: string;
    action?: string;
    result?: string;
  }) =>
    requestJson<AuditPageDto>(`/api/v1/admin/audit${buildQuery(filters)}`, {
      auth: true,
    }),

  getAudit: (id: string) =>
    requestJson<AuditEntryDto>(`/api/v1/admin/audit/${id}`, { auth: true }),

  createClientsExport: (filters?: Record<string, string | undefined>) =>
    requestJson<ExportAcceptedDto>('/api/v1/admin/exports/clients', {
      method: 'POST',
      auth: true,
      body: filters ? { filters } : {},
      idempotent: true,
    }),

  createAuditExport: (filters?: Record<string, string | undefined>) =>
    requestJson<ExportAcceptedDto>('/api/v1/admin/exports/audit', {
      method: 'POST',
      auth: true,
      body: filters ? { filters } : {},
      idempotent: true,
    }),

  getExportStatus: (id: string) =>
    requestJson<ExportJobDto>(`/api/v1/admin/exports/${id}`, { auth: true }),

  downloadExportCsv: (id: string) =>
    downloadAuthenticatedBlob(`/api/v1/admin/exports/${id}/download`),

  createReport: (filters: {
    from: string;
    to: string;
    offerId?: string;
    hotelId?: string;
    status?: string;
  }) =>
    requestJson<OperationAcceptedDto>('/api/v1/admin/reports', {
      method: 'POST',
      auth: true,
      body: { filters },
      idempotent: true,
    }),

  getReport: (id: string) =>
    requestJson<ReportDetailDto>(`/api/v1/admin/reports/${id}`, { auth: true }),

  getReportRows: (id: string, page = 1, pageSize = 10) =>
    requestJson<ReportRowPageDto>(
      `/api/v1/admin/reports/${id}/rows${buildQuery({ page, pageSize })}`,
      { auth: true }
    ),

  requestReportPdf: (id: string) =>
    requestJson<OperationAcceptedDto>(`/api/v1/admin/reports/${id}/pdf`, {
      method: 'POST',
      auth: true,
      idempotent: true,
    }),

  downloadReportPdf: (id: string) =>
    downloadAuthenticatedBlob(`/api/v1/admin/reports/${id}/pdf`),
};
