import React, { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  ClipboardList,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../ui/EditorialPrimitives';

export const RequireAuth: React.FC<{
  requireAdmin?: boolean;
  children: React.ReactNode;
}> = ({ requireAdmin = false, children }) => {
  const { isAuthenticated, isAdmin, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="h-64 rounded-2xl bg-[#F3EDE2] animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/acceso?mode=login&returnTo=${returnTo}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/cuenta" replace />;
  }

  return <>{children}</>;
};

const ADMIN_NAV = [
  {
    to: '/admin/reportes',
    label: 'Reportes & PDF Oficial',
    spec: 'Spec 011',
    icon: BarChart3,
  },
  {
    to: '/admin/reservas',
    label: 'Reservas, Reembolsos & Resend',
    spec: 'Specs 009 · 002 · 004',
    icon: ClipboardList,
  },
  {
    to: '/admin/comercial',
    label: 'Catálogo, Hoteles, R2 & Flota',
    spec: 'Specs 006 · 007 · 012 · 013',
    icon: Briefcase,
  },
  {
    to: '/admin/gobernanza',
    label: 'Clientes, Auditoría & CSV',
    spec: 'Spec 010',
    icon: ShieldCheck,
  },
];

export const AdminEditorialLayout: React.FC = () => {
  const { user, apiOnline, isDemoSession, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)] bg-[#FAF7F2] text-[#12232E]">
      {/* Sidebar Nocturno Andino */}
      <aside
        className={`${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex w-72' : 'hidden lg:flex'
        } flex-col bg-[#12232E] text-[#FAF7F2] p-6 border-r border-white/10 lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="flex items-center justify-between">
          <Link to="/" onClick={() => setSidebarOpen(false)}>
            <BrandLogo inverse />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-[#C89B54] font-semibold">
          Consola Ejecutiva · RBAC Admin
        </div>

        <nav className="mt-6 flex-1 space-y-1.5" aria-label="Módulos administrativos">
          {ADMIN_NAV.map(({ to, label, spec, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-start gap-3 px-3.5 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#B84A27] text-white shadow-sm'
                    : 'text-[#FAF7F2]/75 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="block text-xs font-semibold leading-snug">{label}</span>
                <span className="block text-[10px] opacity-75 font-mono mt-0.5">{spec}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="pt-5 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#FAF7F2]/80 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Portal Público
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#F2B8A9] hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión Administrativa
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="min-w-0 flex flex-col">
        <header className="h-16 bg-[#FFFCF8] border-b border-[#E5DDD0] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E5DDD0] text-[#12232E]"
              aria-label="Abrir navegación administrativa"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs font-bold text-[#12232E]">
                Centro de Operaciones DMGOTRAVEL
              </p>
              <p className="text-[11px] text-[#5C6B73]">
                {apiOnline
                  ? 'Conectado a Monolito Modular ASP.NET Core (/api/v1/admin/*)'
                  : 'Vista ejecutiva local con datos de respaldo'}
                {isDemoSession ? ' · Sesión Demo Admin' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-[#12232E]">{user?.fullName}</p>
              <p className="text-[10px] font-mono text-[#5C6B73]">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#F7EAE4] border border-[#B84A27]/30 text-[#B84A27] font-bold text-xs flex items-center justify-center">
              {(user?.fullName || 'AD').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
