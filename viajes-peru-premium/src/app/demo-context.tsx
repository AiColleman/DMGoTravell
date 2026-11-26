import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuditLog, Hotel, Payment, Reservation, ReservationStatus, Tour, User } from '@/types/domain';
import { auditLogs as initialAuditLogs, customers, demoUser, hotels as initialHotels, payments as initialPayments, reservations as initialReservations, tours as initialTours } from '@/mocks/data';

interface DemoContextValue {
  user: User | null;
  login: (user?: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  adminMode: boolean;
  enterAdmin: () => void;
  exitAdmin: () => void;
  reservations: Reservation[];
  addReservation: (reservation: Reservation) => void;
  setReservationStatus: (id: string, status: ReservationStatus) => void;
  tours: Tour[];
  saveTour: (tour: Tour) => void;
  hotels: Hotel[];
  saveHotel: (hotel: Hotel) => void;
  payments: Payment[];
  customers: User[];
  auditLogs: AuditLog[];
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [reservations, setReservations] = useState(initialReservations);
  const [tours, setTours] = useState(initialTours);
  const [hotels, setHotels] = useState(initialHotels);
  const [payments] = useState(initialPayments);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);

  const logAction = (action: string, entity: string, entityId: string) => {
    setAuditLogs((current) => [{ id: `a-${Date.now()}`, actor: 'Operador demo', action, entity, entityId, date: new Date().toISOString() }, ...current]);
  };

  const setReservationStatus = (id: string, status: ReservationStatus) => {
    setReservations((current) => current.map((reservation) => {
      if (reservation.id !== id || status === reservation.status) return reservation;
      const allowed = (reservation.status === 'pending' && status === 'cancelled')
        || (reservation.status === 'confirmed' && (status === 'completed' || status === 'cancelled'));
      return allowed ? { ...reservation, status } : reservation;
    }));
    if (status !== 'confirmed') logAction(`Estado cambiado a ${status}`, 'Reservation', id);
  };

  return (
    <DemoContext.Provider value={{
      user,
      login: (nextUser = demoUser) => setUser(nextUser),
      logout: () => setUser(null),
      updateUser: setUser,
      adminMode,
      enterAdmin: () => setAdminMode(true),
      exitAdmin: () => setAdminMode(false),
      reservations,
      addReservation: (reservation) => {
        setReservations((current) => [reservation, ...current]);
        logAction('Reserva demo creada', 'Reservation', reservation.id);
      },
      setReservationStatus,
      tours,
      saveTour: (tour) => {
        setTours((current) => current.some((item) => item.id === tour.id) ? current.map((item) => item.id === tour.id ? tour : item) : [tour, ...current]);
        logAction('Tour guardado en sesión', 'Tour', tour.id);
      },
      hotels,
      saveHotel: (hotel) => {
        setHotels((current) => current.some((item) => item.id === hotel.id) ? current.map((item) => item.id === hotel.id ? hotel : item) : [hotel, ...current]);
        logAction('Hotel guardado en sesión', 'Hotel', hotel.id);
      },
      payments,
      customers,
      auditLogs,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('DemoProvider requerido');
  return value;
}
