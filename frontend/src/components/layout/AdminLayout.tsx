import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  ClipboardList,
  Compass,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ADMIN_NAV = [
  {
    to: '/admin/reportes',
    label: 'Indicadores y Reportes PDF',
    subtitle: 'Spec 011 · Operativo y Financiero',
    icon: BarChart3,
  },
  {
    to: '/admin/reservas',
    label: 'Reservas, Devoluciones y Correo',
    subtitle: 'Specs 009, 002 y 004',
    icon: ClipboardList,
  },
  {
    to: '/admin/comercial',
    label: 'Catálogo, Hoteles, R2 y Flota',
    subtitle: 'Specs 006, 007, 012 y 013',
    icon: Briefcase,
  },
  {
    to: '/admin/gobernanza',
    label: 'Clientes, Auditoría y CSV',
    subtitle: 'Spec 010 · Solo lectura inmutable',
    icon: ShieldAlert,
  },
];

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, apiOnline, logout } = useAuth();
  const { notifySuccess } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    notifySuccess('Sesión administrativa cerrada', 'Se revocó la sesión actual.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F1F5F9] text-slate-900">
      {/* Sidebar Ejecutivo Oscuro (#091E32) */}
      <aside className="w-full lg:w-72 bg-[#091E32] text-white flex flex-col justify-between shrink-0 border-r border-white/10">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D95D39] text-white flex items-center justify-center shadow">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <p className="font-headline font-extrabold text-base tracking-tight leading-none">
                  DMGOTRAVEL
                </p>
                <p className="text-[10px] uppercase tracking-widest text-sky-300 font-bold mt-1">
                  Enterprise Backoffice
                </p>
              </div>
            </Link>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] flex items-center justify-between">
            <span className="text-slate-300">Rol activo:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                isAdmin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {user?.role ?? 'visitante'}
            </span>
          </div>

          <nav className="space-y-1.5">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-start gap-3 px-3.5 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#0B3B5B] text-white shadow-sm border border-sky-400/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mt-0.5 text-[#D95D39] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-snug">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-white/10 space-y-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Portal Público
          </Link>
          {user && (
            <div className="pt-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Área Operativa Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline font-extrabold text-lg text-[#0B3B5B]">
              Consola de Operación y Supervisión Empresarial
            </h1>
            <p className="text-xs text-slate-500">
              Moneda oficial PEN (S/) · Control optimista ETag/If-Match · Trazabilidad de auditoría
              activa
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span
              className={`px-3 py-1 rounded-full font-semibold border ${
                apiOnline
                  ? 'bg-emerald-50 text-[#146C53] border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {apiOnline ? 'API /api/v1 Conectada' : 'Modo Vista Ejecutiva (API Offline)'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
