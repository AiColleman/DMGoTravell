import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, isAdmin, apiOnline, logout } = useAuth();
  const { notifySuccess } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    notifySuccess('Sesión finalizada', 'Se cerró la sesión actual de forma segura.');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Cinta institucional superior con estado de conexión a la API */}
      <div className="bg-[#091E32] text-slate-200 text-[11px] py-1.5 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Operadora Turística Oficial · Ayacucho &amp; Cusco
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300 tabular-nums">
              Moneda oficial: <strong className="text-white">PEN (S/)</strong> · Zona horaria:{' '}
              <strong className="text-white">America/Lima (UTC-5)</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {apiOnline === true && (
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                API Conectada (ASP.NET Core 10)
              </span>
            )}
            {apiOnline === false && (
              <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Vista Interactiva Local (Inicia DMGoTravel.Api en :5194 para datos en vivo)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navbar Principal */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto h-20 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#0B3B5B] text-white flex items-center justify-center shadow-sm group-hover:bg-[#D95D39] transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-extrabold text-lg tracking-tight text-[#0B3B5B] leading-none">
                  DMGOTRAVEL
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                  Peruvian Tour Operator
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-[#0B3B5B]'
                      : 'text-slate-600 hover:text-[#0B3B5B] hover:bg-slate-50'
                  }`
                }
              >
                Inicio
              </NavLink>
              <NavLink
                to="/catalogo?tab=tours"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-[#0B3B5B]'
                      : 'text-slate-600 hover:text-[#0B3B5B] hover:bg-slate-50'
                  }`
                }
              >
                Tours y Paquetes
              </NavLink>
              <Link
                to="/catalogo?tab=hotels"
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-[#0B3B5B] hover:bg-slate-50 transition-colors"
              >
                Hoteles Aliados
              </Link>
              <a
                href="/#flota-movilidad"
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-[#0B3B5B] hover:bg-slate-50 transition-colors"
              >
                Nuestra Flota
              </a>
            </nav>
          </div>

          {/* Controles de Usuario */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin/reportes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#091E32] text-white text-xs font-bold hover:bg-[#0B3B5B] transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#D95D39]" />
                    Consola Admin
                  </Link>
                )}
                <Link
                  to="/cuenta"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 text-[#0B3B5B]" />
                  <span className="max-w-[140px] truncate">{user.fullName}</span>
                  {user.emailVerified ? (
                    <span
                      title="Correo verificado"
                      className="w-2 h-2 rounded-full bg-[#146C53]"
                    />
                  ) : (
                    <span
                      title="Correo pendiente de verificación"
                      className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold"
                    >
                      Verificar
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/acceso?mode=login"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/acceso?mode=register"
                  className="px-4 py-2.5 rounded-xl bg-[#D95D39] hover:bg-[#8C2F12] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Crear Cuenta
                </Link>
              </>
            )}
          </div>

          {/* Botón móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="sm:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Inicio
            </Link>
            <Link
              to="/catalogo?tab=tours"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Catálogo de Tours y Paquetes
            </Link>
            <Link
              to="/catalogo?tab=hotels"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Hoteles Aliados
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/cuenta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#0B3B5B] bg-slate-50"
                >
                  Mi Portal ({user?.fullName})
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/reportes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-white bg-[#091E32]"
                  >
                    Consola Administrativa
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-600"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/acceso?mode=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/acceso?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-[#D95D39] text-white text-xs font-bold"
                >
                  Crear Cuenta
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Contenido de Página */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer Corporativo */}
      <footer className="bg-[#091E32] text-slate-300 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D95D39] text-white flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="font-headline font-extrabold text-lg text-white">
                  DMGOTRAVEL
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Agencia y operadora turística integral especializada en Ayacucho, Cusco y rutas
                andinas. Disponibilidad transaccional sin sobreventa y tarifas congeladas en Soles
                (PEN).
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-emerald-300 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Agencia Registrada MINCETUR / DIRCETUR
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                Explorar Plataforma
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/catalogo?tab=tours" className="hover:text-white transition-colors">
                    Tours Diarios Verificados
                  </Link>
                </li>
                <li>
                  <Link to="/catalogo?tab=packages" className="hover:text-white transition-colors">
                    Paquetes Multidía Andinos
                  </Link>
                </li>
                <li>
                  <Link to="/catalogo?tab=hotels" className="hover:text-white transition-colors">
                    Hoteles Boutique Aliados (Reserva Compuesta)
                  </Link>
                </li>
                <li>
                  <a href="/#flota-movilidad" className="hover:text-white transition-colors">
                    Flota Turística Propia (Informativa)
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                Garantía Transaccional
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Bloqueo temporal de cupos por 15 minutos</li>
                <li>Precios oficiales calculados en servidor (PEN)</li>
                <li>Confirmación automática vía Culqi &amp; Yape</li>
                <li>Comprobantes transaccionales vía Resend</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                Central de Operaciones
              </h4>
              <p className="text-xs text-slate-400 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D95D39] shrink-0 mt-0.5" />
                <span>Jr. 28 de Julio, Centro Histórico de Huamanga — Ayacucho, Perú</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-2 tabular-nums">
                <Phone className="w-4 h-4 text-[#D95D39] shrink-0" />
                <span>+51 966 420 810</span>
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                {['Culqi', 'Visa', 'Mastercard', 'Amex', 'Diners', 'Yape'].map((brand) => (
                  <span
                    key={brand}
                    className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} DMGOTRAVEL. Todos los derechos reservados.</p>
            <p className="text-[11px]">
              Arquitectura Monolito Modular · Clean Architecture · CQRS · React + TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
