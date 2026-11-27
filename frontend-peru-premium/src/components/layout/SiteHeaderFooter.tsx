import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DMGO_AGENCY_CONTACT } from '../../lib/peruCatalog';
import { BrandLogo } from '../ui/EditorialPrimitives';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tours', label: 'Tours Turísticos' },
  { to: '/paquetes', label: 'Paquetes Turísticos' },
  { to: '/hoteles', label: 'Hoteles Aliados' },
  { to: '/movilidad', label: 'Flota Turística' },
];

export const PublicEditorialLayout: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isDemoSession, apiOnline, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#12232E]">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#12232E] focus:text-white text-xs font-semibold"
      >
        Saltar al contenido principal
      </a>

      {/* Cinta superior editorial amigable */}
      <div className="bg-[#12232E] text-[#FAF7F2] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 min-h-9 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <span className="inline-flex items-center gap-2 text-[#FAF7F2]/90">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B54]" />
            <span>
              <strong>{DMGO_AGENCY_CONTACT.brand}</strong> · Experiencias y hoteles aliados en Perú
              con tarifas oficiales en Soles (<span className="font-mono">PEN</span>)
            </span>
          </span>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[#FAF7F2]/80">
              Atención WhatsApp: <strong>{DMGO_AGENCY_CONTACT.phones[0]}</strong> ·{' '}
              <strong>{DMGO_AGENCY_CONTACT.phones[1]}</strong>
            </span>

            {apiOnline === true ? (
              <span className="inline-flex items-center gap-1.5 text-[#8BE0B9] font-medium">
                <Wifi className="w-3.5 h-3.5" />
                Reservas en línea activas
              </span>
            ) : apiOnline === false ? (
              <span className="inline-flex items-center gap-1.5 text-[#F2CB88] font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                Modo exploración interactiva
              </span>
            ) : (
              <span className="text-[#FAF7F2]/60">Conectando...</span>
            )}

            {isDemoSession && (
              <span className="px-2 py-0.5 rounded bg-[#C89B54]/20 text-[#F2CB88] text-[10px] font-semibold">
                Sesión de prueba
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header Editorial Sticky */}
      <header className="sticky top-0 z-40 h-20 bg-[#FAF7F2]/92 backdrop-blur-md border-b border-[#E5DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between gap-6">
          <Link to="/" aria-label="DMGOTRAVEL Inicio" onClick={() => setMobileOpen(false)}>
            <BrandLogo />
          </Link>

          <nav
            className="hidden lg:flex items-center gap-5 xl:gap-7 whitespace-nowrap"
            aria-label="Navegación principal"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative py-2 text-[13px] font-semibold tracking-wide transition-colors ${
                    isActive
                      ? 'text-[#B84A27] after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[22px] after:h-[2px] after:bg-[#B84A27]'
                      : 'text-[#5C6B73] hover:text-[#12232E]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin/reportes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#12232E]/20 bg-[#12232E] text-[#FAF7F2] text-xs font-semibold hover:bg-[#263D4D] transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#C89B54]" />
                    Consola Admin
                  </Link>
                )}

                <NavLink
                  to="/cuenta"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-[#B84A27] bg-[#F7EAE4] text-[#B84A27]'
                        : 'border-[#E5DDD0] bg-[#FFFCF8] text-[#12232E] hover:border-[#B84A27]'
                    }`
                  }
                >
                  <UserRound className="w-3.5 h-3.5 text-[#B84A27]" />
                  <span className="max-w-[150px] truncate">Mi Panel · {user.fullName.split(' ')[0]}</span>
                </NavLink>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  aria-label="Cerrar sesión"
                  className="p-2 rounded-xl border border-[#E5DDD0] text-[#5C6B73] hover:text-[#B84A27] hover:border-[#B84A27] cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/acceso"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#12232E] hover:text-[#B84A27] transition-colors"
              >
                Ingresar
              </Link>
            )}

            <Link
              to="/paquetes"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B84A27] hover:bg-[#943618] text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              Planear mi viaje
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            className="lg:hidden p-2.5 rounded-xl border border-[#E5DDD0] bg-[#FFFCF8] text-[#12232E] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav
            aria-label="Navegación móvil"
            className="lg:hidden bg-[#FFFCF8] border-b border-[#E5DDD0] px-4 py-5 space-y-2 shadow-xl"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    isActive ? 'bg-[#F7EAE4] text-[#B84A27]' : 'text-[#12232E]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3 mt-3 border-t border-[#E5DDD0] flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/cuenta"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 rounded-lg bg-[#F3EDE2] text-sm font-semibold text-[#12232E]"
                  >
                    Mi Cuenta · {user.fullName}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/reportes"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg bg-[#12232E] text-sm font-semibold text-white"
                    >
                      Consola Administrativa
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="px-3 py-2.5 rounded-lg border border-[#E5DDD0] text-left text-sm font-semibold text-[#B84A27]"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/acceso"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg bg-[#B84A27] text-center text-sm font-semibold text-white"
                >
                  Ingresar / Crear cuenta
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="contenido-principal" className="flex-1">
        <Outlet />
      </main>

      {/* Footer Nocturno Andino */}
      <footer className="bg-[#12232E] text-[#FAF7F2] pt-16 pb-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            <div className="lg:col-span-4 space-y-4">
              <BrandLogo inverse />
              <p className="text-xs text-[#FAF7F2]/75 leading-relaxed max-w-sm">
                Agencia y operadora turística peruana. Reunimos experiencias de autor, casonas y
                hoteles aliados verificados y pagos seguros en una sola reserva clara y sin cargos
                ocultos.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#C89B54] uppercase tracking-widest font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tarifas Oficiales en Soles (PEN) · Tarjeta &amp; Yape
              </div>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C89B54]">
                Explorar Perú
              </h2>
              <ul className="space-y-2.5 text-xs text-[#FAF7F2]/80">
                <li>
                  <Link to="/tours" className="hover:text-white transition-colors">
                    Tours Turísticos
                  </Link>
                </li>
                <li>
                  <Link to="/paquetes" className="hover:text-white transition-colors">
                    Paquetes Turísticos
                  </Link>
                </li>
                <li>
                  <Link to="/hoteles" className="hover:text-white transition-colors">
                    Casonas &amp; Hoteles Aliados
                  </Link>
                </li>
                <li>
                  <Link to="/movilidad" className="hover:text-white transition-colors">
                    Flota Turística Informativa
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C89B54]">
                Viajero
              </h2>
              <ul className="space-y-2.5 text-xs text-[#FAF7F2]/80">
                <li>
                  <Link to="/cuenta" className="hover:text-white transition-colors">
                    Mis Reservas &amp; Estado
                  </Link>
                </li>
                <li>
                  <Link to="/cuenta?section=perfil" className="hover:text-white transition-colors">
                    Mi Perfil &amp; Datos
                  </Link>
                </li>
                <li>
                  <Link to="/acceso" className="hover:text-white transition-colors">
                    Iniciar Sesión / Registro
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C89B54]">
                Ayuda &amp; Políticas
              </h2>
              <ul className="space-y-2.5 text-xs text-[#FAF7F2]/80">
                <li>
                  <Link to="/politicas?section=terms" className="hover:text-white transition-colors">
                    Términos, Cancelaciones y Reembolsos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/politicas?section=privacy"
                    className="hover:text-white transition-colors"
                  >
                    Política de Privacidad y Datos
                  </Link>
                </li>
                <li>
                  <Link
                    to={isAdmin ? '/admin/reportes' : '/acceso?mode=login&returnTo=/admin/reportes'}
                    className="text-[#C89B54] hover:text-white transition-colors font-semibold"
                  >
                    Acceso Administrativo →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#FAF7F2]/65">
            <span>
              © 2026 {DMGO_AGENCY_CONTACT.brand} ({DMGO_AGENCY_CONTACT.socialHandle}) · Viajes Perú
              Premium · WhatsApp: {DMGO_AGENCY_CONTACT.phones[0]} / {DMGO_AGENCY_CONTACT.phones[1]}
            </span>
            <span>Ayacucho (Huamanga) · Cusco · Arequipa · Lima · Zona Horaria America/Lima</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
