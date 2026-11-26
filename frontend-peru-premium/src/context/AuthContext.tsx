import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { configureAuthInterceptors } from '../api/httpClient';
import { authApi, systemApi } from '../api/services';
import type {
  AuthSessionDto,
  LoginRequest,
  RegisterRequest,
  ReservationDto,
  UserSummaryDto,
} from '../types/api';

/**
 * Cumplimiento ADR-009, RC12, AC04 y C4 Nivel 2 (§3 & §6):
 * - Los accessToken JWT reales firmados por DMGoTravel.Api se mantienen EXCLUSIVAMENTE en memoria
 *   de ejecución (nunca se persisten en localStorage ni sessionStorage).
 * - La continuidad de sesión al recargar el navegador se delega a `/api/v1/auth/refresh` mediante
 *   la cookie `dmgo_refresh` (HttpOnly, SameSite=Strict) y doble envío CSRF (`dmgo_csrf` -> `X-CSRF-Token`).
 * - Solo el actor no sensible del modo Vista Previa Local (cuando la API no está levantada) se
 *   recuerda sin ningún token real.
 */
const LEGACY_SESSION_STORAGE_KEY = 'dmgotravel.peru_premium.session.v2';
const LEGACY_DEMO_RESERVATIONS_KEY = 'dmgotravel.peru_premium.demo_reservations.v2';
const PREVIEW_ACTOR_KEY = 'dmgotravel.peru_premium.preview_actor.v3';
const DEMO_RESERVATIONS_KEY = 'dmgotravel.peru_premium.demo_reservations.v3';

interface PreviewActorDescriptor {
  role: 'client' | 'admin';
  email: string;
  fullName: string;
}

const INITIAL_DEMO_RESERVATIONS: ReservationDto[] = [
  {
    id: 'demo-res-4821',
    reservationNumber: 'DMG-2026-004821',
    offerNameHint: 'Ayacucho Esencial: Huamanga, Aguas Turquesas & Vilcashuamán 3D/2N',
    status: 'pending',
    travelers: 2,
    total: '1420.00',
    currency: 'PEN',
    paymentDeadlineAt: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    validationDeadlineAt: new Date(Date.now() + 19 * 60 * 1000).toISOString(),
    version: 1,
    departure: {
      id: '00000000-0000-4000-8000-000000000208',
      startDate: '2026-12-18T12:00:00Z',
      endDate: '2026-12-20T23:00:00Z',
      price: '590.00',
      currency: 'PEN',
      capacity: 16,
      available: 9,
    },
    lodging: {
      hotelName: 'Hotel Sumaq Plaza',
      roomTypeName: 'Hab. Matrimonial',
      capacity: 2,
      checkInDate: '2026-12-18',
      checkOutDate: '2026-12-20',
      nights: 2,
      nightlyRate: '120.00',
      subtotal: '240.00',
      currency: 'PEN',
    },
  },
  {
    id: 'demo-res-4510',
    reservationNumber: 'DMG-2026-004510',
    offerNameHint: 'Ayacucho Esencial: Huamanga, Aguas Turquesas & Vilcashuamán 3D/2N',
    status: 'confirmed',
    travelers: 2,
    total: '1440.00',
    currency: 'PEN',
    paymentDeadlineAt: '2026-11-20T15:00:00Z',
    validationDeadlineAt: '2026-11-20T15:05:00Z',
    version: 2,
    departure: {
      id: '00000000-0000-4000-8000-000000000208',
      startDate: '2026-12-26T12:00:00Z',
      endDate: '2026-12-28T22:00:00Z',
      price: '590.00',
      currency: 'PEN',
      capacity: 16,
      available: 10,
    },
    lodging: {
      hotelName: 'Hotel Internazionale (Hotel - Restaurant)',
      roomTypeName: 'Hab. Matrimonial Queen',
      capacity: 2,
      checkInDate: '2026-12-26',
      checkOutDate: '2026-12-28',
      nights: 2,
      nightlyRate: '130.00',
      subtotal: '260.00',
      currency: 'PEN',
    },
  },
];

interface AuthContextValue {
  session: AuthSessionDto | null;
  user: UserSummaryDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDemoSession: boolean;
  isBootstrapping: boolean;
  apiOnline: boolean | null;
  login: (payload: LoginRequest) => Promise<AuthSessionDto>;
  register: (payload: RegisterRequest) => Promise<AuthSessionDto>;
  completeOAuthSession: (oauthSession: AuthSessionDto) => void;
  loginDemoRole: (
    role: 'client' | 'admin',
    customName?: string,
    customEmail?: string
  ) => AuthSessionDto;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSessionDto | null>;
  updateLocalUser: (patch: Partial<UserSummaryDto>) => void;
  clearSessionLocally: () => void;
  demoReservations: ReservationDto[];
  upsertDemoReservation: (res: ReservationDto) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildPreviewSession(actor: PreviewActorDescriptor): AuthSessionDto {
  return {
    accessToken: `demo_preview_${actor.role}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: actor.role === 'admin' ? 'demo-admin-01' : 'demo-client-01',
      email: actor.email,
      fullName: actor.fullName,
      role: actor.role,
      emailVerified: true,
    },
  };
}

function readInitialPreviewSession(): AuthSessionDto | null {
  if (typeof window === 'undefined') return null;
  try {
    // Limpia cualquier clave heredada que hubiese guardado tokens en versiones previas
    window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);

    const raw = window.sessionStorage.getItem(PREVIEW_ACTOR_KEY);
    if (!raw) return null;
    const actor = JSON.parse(raw) as PreviewActorDescriptor;
    if (actor.role !== 'client' && actor.role !== 'admin') return null;
    return buildPreviewSession(actor);
  } catch {
    return null;
  }
}

function persistPreviewActor(actor: PreviewActorDescriptor | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (actor) {
      window.sessionStorage.setItem(PREVIEW_ACTOR_KEY, JSON.stringify(actor));
    } else {
      window.sessionStorage.removeItem(PREVIEW_ACTOR_KEY);
    }
  } catch {
    // Ignorar restricciones de sessionStorage
  }
}

function readDemoReservations(): ReservationDto[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_RESERVATIONS;
  try {
    window.sessionStorage.removeItem(LEGACY_DEMO_RESERVATIONS_KEY);
    const raw = window.sessionStorage.getItem(DEMO_RESERVATIONS_KEY);
    return raw ? (JSON.parse(raw) as ReservationDto[]) : INITIAL_DEMO_RESERVATIONS;
  } catch {
    return INITIAL_DEMO_RESERVATIONS;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<AuthSessionDto | null>(() =>
    readInitialPreviewSession()
  );
  const [demoReservations, setDemoReservations] = useState<ReservationDto[]>(() =>
    readDemoReservations()
  );
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const tokenRef = useRef<string | null>(session?.accessToken ?? null);

  const applySession = useCallback((next: AuthSessionDto | null) => {
    tokenRef.current = next?.accessToken ?? null;
    setSessionState(next);

    if (!next) {
      persistPreviewActor(null);
    } else if (next.accessToken.startsWith('demo_preview_')) {
      persistPreviewActor({
        role: next.user.role === 'admin' ? 'admin' : 'client',
        email: next.user.email,
        fullName: next.user.fullName,
      });
    } else {
      // Sesión JWT real emitida por ASP.NET Core -> jamás persistir accessToken en Web Storage
      persistPreviewActor(null);
    }
  }, []);

  useEffect(() => {
    configureAuthInterceptors(
      () => tokenRef.current,
      (updated) => applySession(updated)
    );
  }, [applySession]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await systemApi.health();
        if (active) setApiOnline(true);

        if (document.cookie.includes('dmgo_csrf=')) {
          try {
            const refreshed = await authApi.refresh();
            if (active) applySession(refreshed);
          } catch {
            if (!tokenRef.current?.startsWith('demo_preview_') && active) {
              applySession(null);
            }
          }
        }
      } catch {
        if (active) setApiOnline(false);
      } finally {
        if (active) setIsBootstrapping(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const next = await authApi.login(payload);
      applySession(next);
      setApiOnline(true);
      return next;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const next = await authApi.register(payload);
      applySession(next);
      setApiOnline(true);
      return next;
    },
    [applySession]
  );

  const completeOAuthSession = useCallback(
    (oauthSession: AuthSessionDto) => {
      applySession(oauthSession);
      setApiOnline(true);
    },
    [applySession]
  );

  const loginDemoRole = useCallback(
    (role: 'client' | 'admin', customName?: string, customEmail?: string) => {
      const demoSession = buildPreviewSession({
        role,
        email:
          customEmail ||
          (role === 'admin' ? 'operaciones@dmgotravel.pe' : 'valeria.quispe@viajero.pe'),
        fullName:
          customName || (role === 'admin' ? 'Camilo Conde · Dirección' : 'Valeria Quispe Mendoza'),
      });
      applySession(demoSession);
      return demoSession;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    const wasDemo = tokenRef.current?.startsWith('demo_preview_');
    try {
      if (!wasDemo) {
        await authApi.logout();
      }
    } catch {
      // Garantizar limpieza local en memoria
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const refreshSession = useCallback(async () => {
    try {
      const next = await authApi.refresh();
      applySession(next);
      setApiOnline(true);
      return next;
    } catch {
      return null;
    }
  }, [applySession]);

  const updateLocalUser = useCallback((patch: Partial<UserSummaryDto>) => {
    setSessionState((prev) => {
      if (!prev) return null;
      const updated: AuthSessionDto = {
        ...prev,
        user: { ...prev.user, ...patch },
      };
      if (updated.accessToken.startsWith('demo_preview_')) {
        persistPreviewActor({
          role: updated.user.role === 'admin' ? 'admin' : 'client',
          email: updated.user.email,
          fullName: updated.user.fullName,
        });
      }
      return updated;
    });
  }, []);

  const clearSessionLocally = useCallback(() => {
    applySession(null);
  }, [applySession]);

  const upsertDemoReservation = useCallback((res: ReservationDto) => {
    setDemoReservations((prev) => {
      const exists = prev.some((item) => item.id === res.id);
      const next = exists ? prev.map((item) => (item.id === res.id ? res : item)) : [res, ...prev];
      try {
        window.sessionStorage.setItem(DEMO_RESERVATIONS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(session?.accessToken && user);
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isDemoSession = Boolean(session?.accessToken?.startsWith('demo_preview_'));

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthenticated,
        isAdmin,
        isDemoSession,
        isBootstrapping,
        apiOnline,
        login,
        register,
        completeOAuthSession,
        loginDemoRole,
        logout,
        refreshSession,
        updateLocalUser,
        clearSessionLocally,
        demoReservations,
        upsertDemoReservation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return ctx;
}
