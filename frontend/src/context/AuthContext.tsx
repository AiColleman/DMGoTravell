import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { configureAuthInterceptors } from '../api/httpClient';
import { authApi, systemApi } from '../api/services';
import type { AuthSessionDto, LoginRequest, RegisterRequest, UserSummaryDto } from '../types/api';

const SESSION_STORAGE_KEY = 'dmgotravel.session.v1';

interface AuthContextValue {
  session: AuthSessionDto | null;
  user: UserSummaryDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBootstrapping: boolean;
  apiOnline: boolean | null;
  login: (payload: LoginRequest) => Promise<AuthSessionDto>;
  register: (payload: RegisterRequest) => Promise<AuthSessionDto>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSessionDto | null>;
  updateLocalUser: (patch: Partial<UserSummaryDto>) => void;
  clearSessionLocally: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readPersistedSession(): AuthSessionDto | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSessionDto) : null;
  } catch {
    return null;
  }
}

function writePersistedSession(session: AuthSessionDto | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignorar cuotas de almacenamiento restringidas
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<AuthSessionDto | null>(() => readPersistedSession());
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const tokenRef = useRef<string | null>(session?.accessToken ?? null);

  const applySession = useCallback((next: AuthSessionDto | null) => {
    tokenRef.current = next?.accessToken ?? null;
    setSessionState(next);
    writePersistedSession(next);
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

        // Si existe cookie dmgo_csrf intentamos renovar silenciosamente la sesión
        if (document.cookie.includes('dmgo_csrf=')) {
          try {
            const refreshed = await authApi.refresh();
            if (active) applySession(refreshed);
          } catch {
            // Si el refresh expiró, conservamos sesión previa solo si aún es válida o limpiamos
            if (!tokenRef.current && active) applySession(null);
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

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Garantizar limpieza local incluso ante expiración previa
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const refreshSession = useCallback(async () => {
    try {
      const next = await authApi.refresh();
      applySession(next);
      return next;
    } catch {
      return null;
    }
  }, [applySession]);

  const updateLocalUser = useCallback(
    (patch: Partial<UserSummaryDto>) => {
      setSessionState((prev) => {
        if (!prev) return null;
        const updated: AuthSessionDto = {
          ...prev,
          user: { ...prev.user, ...patch },
        };
        writePersistedSession(updated);
        return updated;
      });
    },
    []
  );

  const clearSessionLocally = useCallback(() => {
    applySession(null);
  }, [applySession]);

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(session?.accessToken && user);
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthenticated,
        isAdmin,
        isBootstrapping,
        apiOnline,
        login,
        register,
        logout,
        refreshSession,
        updateLocalUser,
        clearSessionLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  }
  return ctx;
}
