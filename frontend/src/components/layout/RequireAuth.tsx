import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isBootstrapping, apiOnline } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#0B3B5B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Verificando sesión segura...</p>
        </div>
      </div>
    );
  }

  // Cuando la API está desconectada permitimos previsualizar la consola con aviso explícito;
  // cuando la API está en línea aplicamos estrictamente RBAC (RN-25 / RN-26).
  if (apiOnline !== false && !isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/acceso?mode=login&returnTo=${returnTo}`} replace />;
  }

  if (requireAdmin && apiOnline !== false && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-16 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-headline font-extrabold text-xl text-slate-900">
          Acceso Restringido (403 Forbidden · RN-26)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Esta sección requiere una cuenta con rol <code className="font-mono font-bold">admin</code>.
          Tu sesión actual tiene rol de viajero (<code className="font-mono">client</code>).
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/cuenta"
            className="px-4 py-2.5 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold"
          >
            Ir a Mi Portal de Cliente
          </Link>
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (apiOnline === false && !isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 text-xs text-amber-900">
          <span className="flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 shrink-0 text-amber-700" />
            Modo previsualización sin conexión activa: al iniciar el backend ASP.NET Core, esta ruta
            exigirá token JWT válido{requireAdmin ? ' con rol admin' : ''}.
          </span>
          <Link
            to="/acceso"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-900 text-white font-bold"
          >
            Autenticarse
          </Link>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};
