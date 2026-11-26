export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

export interface TourDeparture {
  id: string;
  date: string;
  available: number;
  price: number;
}

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  title: string;
  destination: string;
  category: string;
  duration: string;
  days: number;
  price: number;
  image: string;
  gallery: string[];
  badge?: string;
  active: boolean;
  description: string;
  departures: TourDeparture[];
  itinerary: ItineraryItem[];
  includes: string[];
  excludes: string[];
  recommendations: string[];
  meetingPoint?: string;
}

export interface RoomType {
  id: string;
  name: string;
  capacity: number;
  price: number;
  inventory: number;
}

export interface Hotel {
  id: string;
  name: string;
  destination: string;
  category: number;
  description: string;
  image: string;
  price: number;
  services: string[];
  rooms: RoomType[];
  active: boolean;
}

export interface ReservationItem {
  type: 'tour' | 'hotel';
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Reservation {
  id: string;
  code: string;
  userId: string;
  tourId: string;
  hotelId?: string;
  roomId?: string;
  status: ReservationStatus;
  date: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  guests?: number;
  travelers: number;
  items: ReservationItem[];
  total: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  status: PaymentStatus;
  amount: number;
  externalReference: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  active: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  date: string;
}
