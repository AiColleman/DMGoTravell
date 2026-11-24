// ============================================================================
// Contratos exactos alineados con DMGoTravel.Api / Application DTOs (Specs 001-013)
// ============================================================================

export interface FieldValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ClosureBlockerDto {
  type: string;
  reference: string;
  status: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  traceId: string;
  detail: string;
  instance?: string;
  errors?: FieldValidationError[];
  blockers?: ClosureBlockerDto[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

// --- Spec 005 & 005-C: Auth ---
export type UserRole = 'client' | 'admin' | string;

export interface UserSummaryDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface AuthSessionDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummaryDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OperationResultDto {
  id: string;
  status: string;
  version: number;
}

export interface OperationAcceptedDto {
  id: string;
  status: string;
  referenceAt: string;
  expiresAt: string;
}

// --- Spec 008: Profile ---
export interface PendingEmailChangeDto {
  newEmail: string;
  requestedAt: string;
}

export interface ProfileDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  emailVerified: boolean;
  pendingEmailChange?: PendingEmailChangeDto | null;
}

// --- Spec 006 & 012: Catalog & Media ---
export type CatalogApiType = 'tours' | 'packages';
export type OfferEntityType = 'tour' | 'package';

export interface ImageAssetDto {
  id: string;
  url: string;
  isPrimary: boolean;
  version: number;
}

export interface CatalogOfferDto {
  id: string;
  type: OfferEntityType | string;
  name: string;
  description: string;
  price: string;
  currency: string;
  durationDays: number;
  images: ImageAssetDto[];
  conditions: string[];
  // Metadatos opcionales para enriquecimiento visual cuando aplica descuento de muestra
  originalPriceHint?: string;
  badgeHint?: string;
  nextDepartureHint?: string;
}

export interface ItineraryItemDto {
  day: number;
  title: string;
  description: string;
}

export interface DepartureDto {
  id: string;
  startDate: string;
  endDate: string;
  price: string;
  currency: string;
  capacity?: number | null;
  available?: number | null;
}

export interface CatalogOfferDetailDto extends CatalogOfferDto {
  itinerary: ItineraryItemDto[];
  departures: DepartureDto[];
}

export interface CatalogListDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: CatalogOfferDto[];
}

export interface CatalogFilterParams {
  page?: number;
  pageSize?: number;
  priceMin?: number;
  priceMax?: number;
  durationMin?: number;
  durationMax?: number;
  startDate?: string;
  endDate?: string;
  destination?: string;
}

// --- Spec 007: Hotels & Lodging Proposals ---
export interface RoomTypeDto {
  id: string;
  name: string;
  capacity: number;
  basePrice: string;
  currency: string;
  images: ImageAssetDto[];
}

export interface HotelPublicItemDto {
  id: string;
  name: string;
  description: string;
  services: string[];
  images: ImageAssetDto[];
  hasAvailability: boolean;
  lowestBasePrice?: string | null;
}

export interface HotelPublicListDto {
  items: HotelPublicItemDto[];
}

export interface HotelPublicDetailDto extends HotelPublicItemDto {
  roomTypes: RoomTypeDto[];
}

export interface LodgingProposalDto {
  id: string;
  hotelId: string;
  departureId: string;
  startDate: string;
  endDate: string;
  roomTypes: RoomTypeDto[];
}

export interface LodgingProposalListDto {
  items: LodgingProposalDto[];
}

// --- Spec 013: Informative Mobility ---
export interface MobilityPublicItemDto {
  id: string;
  name: string;
  description: string;
  capacity: number;
  image?: ImageAssetDto | null;
  vehicleTypeHint?: string;
}

export interface MobilityPublicListDto {
  items: MobilityPublicItemDto[];
}

// --- Spec 001: Reservations ---
export type CommercialReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ReservationLodgingSnapshotView {
  hotelName: string;
  roomTypeName: string;
  capacity: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  nightlyRate: string;
  subtotal: string;
  currency: string;
}

export interface ReservationDto {
  id: string;
  reservationNumber: string;
  status: CommercialReservationStatus | string;
  departure?: DepartureDto | null;
  lodging?: ReservationLodgingSnapshotView | null;
  travelers: number;
  total: string;
  currency: string;
  paymentDeadlineAt: string;
  validationDeadlineAt: string;
  version: number;
}

export interface ReservationPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: ReservationDto[];
}

export interface CreateReservationRequest {
  departureId: string;
  travelers: number;
  lodging?: {
    proposalId: string;
    roomTypeId: string;
  } | null;
}

// --- Spec 002: Payments & Refunds ---
export type PaymentMethodType = 'card' | 'yape';

export interface PaymentAttemptDto {
  id: string;
  reservationId: string;
  method: PaymentMethodType | string;
  status: string;
  amount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PaymentStartResponseDto {
  payment: PaymentAttemptDto;
  providerData?: {
    providerReference?: string;
    [key: string]: unknown;
  } | null;
}

export interface RefundCaseDto {
  id: string;
  reservationId: string;
  paymentId: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  evidence?: Record<string, unknown> | null;
  version: number;
}

export interface RefundCasePageDto {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  items: RefundCaseDto[];
}

// --- Admin DTOs (Specs 006, 007, 009, 010, 011, 012, 013, 004) ---
export interface CatalogAdminItemDto {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'inactive' | string;
  version: number;
  updatedAt: string;
}

export interface CatalogAdminPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: CatalogAdminItemDto[];
}

export interface HotelAdminItemDto {
  id: string;
  name: string;
  status: 'active' | 'inactive' | string;
  version: number;
  updatedAt: string;
}

export interface HotelAdminPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: HotelAdminItemDto[];
}

export interface InventoryRowDto {
  date: string;
  quantity: number;
  version: number;
}

export interface MobilityAdminItemDto {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  status: 'active' | 'inactive' | string;
  image?: ImageAssetDto | null;
  version: number;
  updatedAt: string;
}

export interface MobilityAdminPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: MobilityAdminItemDto[];
}

export interface AdminReservationClientDto {
  id: string;
  fullName?: string | null;
  email?: string | null;
  status: string;
  reservationCount: number;
  registeredAt?: string | null;
}

export interface AdminReservationDto extends ReservationDto {
  client: AdminReservationClientDto;
  cancellationReason?: string | null;
}

export interface AdminReservationPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: AdminReservationDto[];
}

export interface ClientSummaryDto {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  emailVerified?: boolean | null;
  status: string;
  reservationCount: number;
  registeredAt?: string | null;
}

export interface ClientPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: ClientSummaryDto[];
}

export interface AuditEntryDto {
  id: string;
  occurredAt: string;
  actor: string;
  entity: string;
  entityId: string;
  action: string;
  result: string;
  correlationId?: string | null;
  summary?: string | null;
}

export interface AuditPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: AuditEntryDto[];
}

export interface ExportAcceptedDto {
  id: string;
  status: string;
  referenceAt: string;
  expiresAt: string;
}

export interface ExportJobDto {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  downloadPath?: string | null;
}

export interface NotificationIncidentDto {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  deliveryId: string;
  recipientMasked: string;
  detail: string;
}

export interface NotificationIncidentPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  items: NotificationIncidentDto[];
}

// --- Spec 011: Reports ---
export interface ReportOfferBreakdownDto {
  offerId: string;
  offerName: string;
  offerType: string;
  reservations: number;
  travelers: number;
  touristSubtotal: string;
  currency: string;
}

export interface ReportHotelBreakdownDto {
  hotelId: string;
  hotelName: string;
  reservations: number;
  lodgingSubtotal: string;
  currency: string;
}

export interface ReportCurrencyMovementDto {
  currency: string;
  confirmedPayments: string;
  executedRefunds: string;
  netDifference: string;
  paymentCount: number;
  refundCount: number;
}

export interface ReportSummaryDto {
  from: string;
  to: string;
  totalReservations: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  totalTravelers: number;
  contractedTouristTotal: string;
  contractedLodgingTotal: string;
  contractedTotal: string;
  contractedCurrency: string;
  byOffer: ReportOfferBreakdownDto[];
  byHotel: ReportHotelBreakdownDto[];
  financialMovements: ReportCurrencyMovementDto[];
}

export interface ReportRowDto {
  reservationId: string;
  reservationNumber: string;
  status: string;
  offerName: string;
  hotelName?: string | null;
  travelers: number;
  touristSubtotal: string;
  lodgingSubtotal: string;
  total: string;
  currency: string;
  createdAt: string;
}

export interface ReportRowPageDto {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  items: ReportRowDto[];
}

export interface ReportDetailDto {
  id: string;
  referenceAt: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  rowsCount: number;
  pdfStatus: string;
  summary: ReportSummaryDto;
}
