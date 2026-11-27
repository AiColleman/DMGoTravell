import React, { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Bus,
  ClipboardList,
  Compass,
  Hotel,
  Image,
  LogOut,
  MailCheck,
  Menu,
  RotateCcw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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

interface AdminNavItem {
  to: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminNavGroup {
  groupLabel: string;
  items: AdminNavItem[];
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupLabel: 'Análisis y Operaciones',
    items: [
      {
        to: '/admin/reportes',
        label: 'Reportes Financieros',
        subtitle: 'Ventas, cobros y PDF oficial',
        icon: BarChart3,
      },
      {
        to: '/admin/reservas',
        label: 'Gestión de Reservas',
        subtitle: 'Confirmadas, cierres y cancelaciones',
        icon: ClipboardList,
      },
      {
        to: '/admin/devoluciones',
        label: 'Devoluciones',
        subtitle: 'Autorización y estado de reembolsos',
        icon: RotateCcw,
      },
      {
        to: '/admin/notificaciones',
        label: 'Correos y Avisos',
        subtitle: 'Entregas y reenvío a clientes',
        icon: MailCheck,
      },
    ],
  },
  {
    groupLabel: 'Catálogo y Servicios',
    items: [
      {
        to: '/admin/ofertas',
        label: 'Tours y Paquetes',
        subtitle: 'Experiencias y fechas de salida',
        icon: Compass,
      },
      {
        to: '/admin/hoteles',
        label: 'Hoteles y Habitaciones',
        subtitle: 'Tarifas, cupos y estancias 24 h',
        icon: Hotel,
      },
      {
        to: '/admin/movilidad',
        label: 'Flota Turística',
        subtitle: 'Unidades y capacidad de viaje',
        icon: Bus,
      },
      {
        to: '/admin/galeria',
        label: 'Galería Fotográfica',
        subtitle: 'Subir o cambiar fotos oficiales',
        icon: Image,
      },
    ],
  },
  {
    groupLabel: 'Clientes y Seguridad',
    items: [
      {
        to: '/admin/clientes',
        label: 'Directorio de Clientes',
        subtitle: 'Viajeros registrados y exportar CSV',
        icon: Users,
      },
      {
        to: '/admin/auditoria',
        label: 'Historial de Actividad',
        subtitle: 'Registro de seguridad y exportar CSV',
        icon: ShieldCheck,
      },
    ],
  },
];

const FLAT_ADMIN_ITEMS = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export const AdminEditorialLayout: React.FC = () => {
  const { user, apiOnline, isDemoSession, login, logout } = useAuth();
  const { notifyError, notifySuccess } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectingRealDb, setConnectingRealDb] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentNav =
    FLAT_ADMIN_ITEMS.find((item) => location.pathname.startsWith(item.to)) ?? FLAT_ADMIN_ITEMS[0]!;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleConnectRealDatabase = async () => {
    setConnectingRealDb(true);
    try {
      await login({ email: 'admin@dmgotravel.com', password: 'Admin-DMGo-2026!' });
      notifySuccess(
        'Conectado a la base de datos real',
        'Ahora estás viendo los clientes, reservas y actividad reales de PostgreSQL.'
      );
    } catch {
      notifyError(
        new Error(
          'Asegúrate de tener encendido el backend (dotnet run --project src/DMGoTravel.Api en el puerto 5194).'
        ),
        'Servidor backend apagado'
      );
    } finally {
      setConnectingRealDb(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[284px_minmax(0,1fr)] bg-[#F7F4EE] text-[#12232E]">
      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#12232E]/50 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Barra Lateral Ejecutiva */}
      <aside
        className={`${
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex w-72' : 'hidden lg:flex'
        } flex-col bg-[#12232E] text-[#FAF7F2] border-r border-white/10 lg:sticky lg:top-0 lg:h-screen`}
      >
        {/* Cabecera de Marca */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/" onClick={() => setSidebarOpen(false)}>
            <BrandLogo inverse />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación Agrupada por Funcionalidad */}
        <nav
          className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5"
          aria-label="Módulos administrativos"
        >
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B54]/90">
                {group.groupLabel}
              </p>
              {group.items.map(({ to, label, subtitle, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#B84A27] text-white shadow-sm'
                        : 'text-[#FAF7F2]/80 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/18 text-white'
                            : 'bg-white/6 text-[#C89B54] group-hover:bg-white/12 group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold leading-tight truncate">
                          {label}
                        </span>
                        <span
                          className={`block text-[10px] leading-snug truncate mt-0.5 ${
                            isActive ? 'text-white/85' : 'text-[#FAF7F2]/55'
                          }`}
                        >
                          {subtitle}
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Pie de Barra Lateral */}
        <div className="p-3.5 border-t border-white/10 space-y-1.5 bg-[#0E1C26]">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#FAF7F2]/85 hover:text-white hover:bg-white/8 transition-colors"
          >
            <span>Ver Portal de Viajeros</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C89B54]" />
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#F2B8A9] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área Principal de Trabajo */}
      <div className="min-w-0 flex flex-col">
        <header className="h-16 bg-[#FFFCF8]/95 backdrop-blur-md border-b border-[#E5DDD0] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E5DDD0] bg-white text-[#12232E] cursor-pointer"
              aria-label="Abrir navegación administrativa"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#5C6B73] hidden sm:inline">Panel de Administración</span>
                <span className="text-[#D2C6B4] hidden sm:inline">/</span>
                <strong className="font-bold text-[#12232E] truncate">{currentNav.label}</strong>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#5C6B73]">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    apiOnline && !isDemoSession ? 'bg-[#1B5E4A]' : 'bg-[#C89B54]'
                  }`}
                />
                <span className="truncate">
                  {apiOnline && !isDemoSession
                    ? 'Conectado en tiempo real'
                    : 'Modo vista previa interactiva'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#12232E] text-xs font-semibold text-[#12232E] transition-colors"
            >
              Sitio público
              <ArrowUpRight className="w-3.5 h-3.5 text-[#B84A27]" />
            </Link>

            <div className="h-6 w-px bg-[#E5DDD0] hidden sm:block" />

            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-[#12232E] leading-tight">
                {user?.fullName || 'Administrador'}
              </p>
              <p className="text-[11px] text-[#5C6B73] leading-tight">
                {user?.email || 'Dirección DM GO TRAVEL'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#12232E] text-[#FAF7F2] font-bold text-xs flex items-center justify-center shadow-xs">
              {(user?.fullName || 'AD').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-1 space-y-5">
          {(isDemoSession || apiOnline === false) && (
            <div className="rounded-2xl bg-[#FBF4E4] border border-[#E8D2A0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-[#7A4E0D]">
                <strong>Estás viendo datos de demostración.</strong>{' '}
                {apiOnline === false
                  ? 'Enciende el backend (.NET API) para consultar los usuarios y reservas reales de tu base de datos.'
                  : 'Conéctate a la sesión administrativa real para ver los usuarios que se registraron en tu base de datos.'}
              </div>
              <button
                type="button"
                disabled={connectingRealDb}
                onClick={() => void handleConnectRealDatabase()}
                className="px-4 py-2 rounded-xl bg-[#12232E] hover:bg-[#B84A27] disabled:opacity-50 text-white font-bold transition-colors cursor-pointer shrink-0"
              >
                {connectingRealDb ? 'Conectando...' : 'Ver datos reales de mi BD'}
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
