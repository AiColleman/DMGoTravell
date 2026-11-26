import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, Clock3, Info, MapPin, Mountain, SearchX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Hotel, Tour } from '@/types/domain';

export const money = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateLabel = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
export const shortDate = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
export const todayISO = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};
export const addDays = (date: string, days: number) => {
  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
};

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <span className={`brand ${inverse ? 'brand-inverse' : ''}`}><span className="brand-mark"><Mountain /></span><span className="brand-word">DMGO<span>TRAVEL</span><small>AGENCIA & OPERADORA · PERÚ</small></span></span>;
}

export function DemoBadge({ dark = false }: { dark?: boolean }) {
  return <span className={`demo-badge ${dark ? 'demo-badge-dark' : ''}`}><Info size={12} />Modo demostración</span>;
}

export function DemoNote({ children = 'Contenido, tarifas y cupos son datos ilustrativos. No representan disponibilidad ni condiciones comerciales reales.' }: { children?: ReactNode }) {
  return <p className="demo-note"><Info size={14} />{children}</p>;
}

export function SectionTitle({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</div>;
}

export function TourCard({ tour }: { tour: Tour }) {
  return <article className="travel-card">
    <Link to="/tours/$id" params={{ id: tour.id }} className="card-photo" aria-label={`Ver ${tour.title}`}>
      <img src={tour.image} alt={`${tour.destination}, Perú`} width={1280} height={960} loading="lazy" />
      {tour.badge && <span className="photo-badge">{tour.badge}</span>}
    </Link>
    <div className="card-body">
      <div className="card-kicker"><span><MapPin size={14} />{tour.destination}</span><span>{tour.category}</span></div>
      <Link to="/tours/$id" params={{ id: tour.id }} className="card-title">{tour.title}</Link>
      <div className="card-meta"><Clock3 size={15} />{tour.duration}</div>
      <div className="card-bottom"><span><small>Tarifa demo desde</small><strong>{money(tour.price)}</strong><small>por persona</small></span><span className="round-link"><ArrowRight size={18} /></span></div>
    </div>
  </article>;
}

export function HotelCard({ hotel }: { hotel: Hotel }) {
  return <article className="travel-card">
    <Link to="/hotels/$id" params={{ id: hotel.id }} className="card-photo" aria-label={`Ver ${hotel.name}`}>
      <img src={hotel.image} alt={`Alojamiento ilustrativo en ${hotel.destination}`} width={1280} height={960} loading="lazy" />
      <span className="photo-badge">Alojamiento opcional</span>
    </Link>
    <div className="card-body">
      <div className="card-kicker"><span><MapPin size={14} />{hotel.destination}</span><span>{'★'.repeat(hotel.category)} demo</span></div>
      <Link to="/hotels/$id" params={{ id: hotel.id }} className="card-title">{hotel.name}</Link>
      <div className="card-meta">{hotel.services.slice(0, 3).join(' · ')}</div>
      <div className="card-bottom"><span><small>Tarifa demo por noche</small><strong>{money(hotel.price)}</strong><small>desde</small></span><span className="round-link"><ArrowRight size={18} /></span></div>
    </div>
  </article>;
}

export const statusLabels: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada',
  processing: 'En validación', succeeded: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado', partially_refunded: 'Reembolso parcial',
  active: 'Activo', inactive: 'Inactivo',
};

export function Status({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{statusLabels[status] ?? status}</span>;
}

export function EmptyState({ title = 'No encontramos resultados', description = 'Prueba con otros filtros para continuar explorando.', children }: { title?: string; description?: string; children?: ReactNode }) {
  return <div className="empty-state"><SearchX /><h2>{title}</h2><p>{description}</p>{children}</div>;
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return <div className="empty-state error-state" role="alert"><AlertCircle /><h2>No pudimos cargar la información</h2><p>La conexión con el catálogo no está disponible. Inténtalo nuevamente.</p>{retry && <Button onClick={retry}>Reintentar</Button>}</div>;
}

export function Breadcrumbs({ label, hotel = false }: { label: string; hotel?: boolean }) {
  return <nav aria-label="Ruta de navegación" className="breadcrumbs"><Link to="/">Inicio</Link><span>/</span><Link to={hotel ? '/hotels' : '/tours'}>{hotel ? 'Hoteles' : 'Tours'}</Link><span>/</span><span aria-current="page">{label}</span></nav>;
}

export function PageIntro({ eyebrow = 'DMGOTRAVEL · PERÚ', title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}

export function TravelerLabel({ count }: { count: number }) {
  return <span className="inline-meta"><Users size={15} />{count} {count === 1 ? 'viajero' : 'viajeros'}</span>;
}
