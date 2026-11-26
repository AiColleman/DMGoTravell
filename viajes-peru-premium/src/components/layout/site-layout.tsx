import { useEffect, useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowUpRight, ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/common/shared';
import { useDemo } from '@/app/demo-context';

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, logout } = useDemo();
  useEffect(() => setOpen(false), [pathname]);

  if (pathname.startsWith('/admin')) return <>{children}</>;

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <div className="demo-ribbon">Vista de demostración · No se procesan reservas, pagos ni accesos reales</div>
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" aria-label="DMGOTRAVEL, inicio"><Logo /></Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <Link to="/" activeOptions={{ exact: true }}>Inicio</Link>
          <Link to="/tours">Experiencias</Link>
          <Link to="/hotels">Hoteles</Link>
          <Link to="/about">Nosotros</Link>
        </nav>
        <div className="header-actions">
          {user ? <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="user-trigger"><UserRound />{user.name}<ChevronDown /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link to="/account">Mi cuenta</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/account/reservations">Mis reservas</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={logout}><LogOut />Cerrar sesión demo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <Button asChild variant="ghost" className="login-header"><Link to="/login">Ingresar</Link></Button>}
          <Button asChild className="explore-header"><Link to="/tours">Planear mi viaje<ArrowUpRight /></Link></Button>
          <Button variant="ghost" size="icon" className="mobile-menu-button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {open && <nav className="mobile-nav" aria-label="Navegación móvil">
        <Link to="/">Inicio</Link><Link to="/tours">Experiencias</Link><Link to="/hotels">Hoteles</Link><Link to="/about">Nosotros</Link>
        <Link to={user ? '/account' : '/login'}>{user ? 'Mi cuenta' : 'Ingresar a la demo'}</Link>
        <Link to="/admin">Panel de gestión demo</Link>
      </nav>}
    </header>
    <main id="contenido">{children}</main>
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand"><Link to="/"><Logo inverse /></Link><p>Experiencias y alojamiento en Perú,<br />en una sola intención de viaje.</p><span className="footer-demo">Producto en demostración</span></div>
          <div><h2>Explora</h2><Link to="/tours">Tours y experiencias</Link><Link to="/hotels">Hoteles</Link><Link to="/about">Nosotros</Link></div>
          <div><h2>Tu cuenta</h2><Link to="/account/reservations">Mis reservas</Link><Link to="/account/profile">Mi perfil</Link><Link to="/login">Acceso demo</Link></div>
          <div><h2>Información</h2><Link to="/policies" search={{ section: 'terms' }}>Términos de la demo</Link><Link to="/policies" search={{ section: 'privacy' }}>Privacidad</Link><Link to="/admin">Panel de gestión demo</Link></div>
        </div>
        <div className="footer-bottom"><span>© 2026 DMGOTRAVEL · Proyecto demostrativo</span><span>Ayacucho · Cusco · Arequipa · Lima</span></div>
      </div>
    </footer>
  </>;
}
