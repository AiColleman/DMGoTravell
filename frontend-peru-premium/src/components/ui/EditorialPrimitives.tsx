import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  Mountain,
  Sparkles,
  Timer,
} from 'lucide-react';
import { formatPen, parseDecimal } from '../../lib/format';
import {
  EDITORIAL_SVG_PLACEHOLDER,
  extractHotelEditorialMeta,
  inferDestination,
  PERU_ASSETS,
  resolveMediaUrl,
} from '../../lib/peruCatalog';
import type { CatalogOfferDto, HotelPublicItemDto } from '../../types/api';

export const BrandLogo: React.FC<{ inverse?: boolean }> = ({ inverse = false }) => (
  <span className="inline-flex items-center gap-3 select-none group">
    <span
      className={`w-10 h-11 rounded-lg border flex flex-col items-center justify-center transition-colors ${inverse
        ? 'border-[#C89B54]/50 bg-white/5 text-[#C89B54]'
        : 'border-[#B84A27]/35 bg-[#F7EAE4]/70 text-[#B84A27] group-hover:bg-[#B84A27] group-hover:text-white'
        }`}
    >
      <Mountain className="w-5 h-5 stroke-[1.7]" />
    </span>
    <span className="flex flex-col leading-none">
      <span
        className={`text-[18px] font-bold tracking-tight ${inverse ? 'text-[#FAF7F2]' : 'text-[#12232E]'
          }`}
      >
        DMGO<span className={inverse ? 'text-[#C89B54]' : 'text-[#B84A27]'}>TRAVEL</span>
      </span>
      <span
        className={`text-[9px] font-semibold uppercase tracking-[0.22em] mt-1.5 ${inverse ? 'text-[#FAF7F2]/65' : 'text-[#5C6B73]'
          }`}
      >
        Viajes Perú Premium
      </span>
    </span>
  </span>
);

export const PeruPhoto: React.FC<{
  src?: string | null;
  alt: string;
  category?: 'tour' | 'package' | 'hotel' | 'room' | 'mobility';
  seedIndex?: number;
  hintText?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}> = ({
  src,
  alt,
  category = 'tour',
  seedIndex = 0,
  hintText = '',
  loading = 'lazy',
  className = '',
}) => {
    const effectiveHint = hintText || alt;
    const primarySrc = resolveMediaUrl(src, category, seedIndex, effectiveHint);
    const fallbackPhotoSrc = resolveMediaUrl(null, category, seedIndex, effectiveHint);
    const secondarySrc = primarySrc !== fallbackPhotoSrc ? fallbackPhotoSrc : PERU_ASSETS.peruHero;
    const [stage, setStage] = useState<0 | 1 | 2>(0);

    useEffect(() => {
      setStage(0);
    }, [src, category, seedIndex, effectiveHint]);

    const activeSrc =
      stage === 0 ? primarySrc : stage === 1 ? secondarySrc : EDITORIAL_SVG_PLACEHOLDER;

    const advanceFallback = () => {
      setStage((prev) => (prev < 2 ? ((prev + 1) as 1 | 2) : 2));
    };

    return (
      <img
        src={activeSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={advanceFallback}
        className={className}
      />
    );
  };

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  pending: {
    label: 'Pendiente de Pago',
    style: 'bg-[#FBF4E4] text-[#855814] border-[#E8D2A0]',
  },
  confirmed: {
    label: 'Confirmada',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
  completed: {
    label: 'Completada',
    style: 'bg-[#EBF1F6] text-[#1D4663] border-[#C3D6E6]',
  },
  cancelled: {
    label: 'Cancelada',
    style: 'bg-[#FBECE9] text-[#8E2B17] border-[#EABCB3]',
  },
  approved: {
    label: 'Pago Aprobado',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
  succeeded: {
    label: 'Pagado',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
  unknown: {
    label: 'En Verificación Culqi',
    style: 'bg-[#FBF4E4] text-[#855814] border-[#E8D2A0]',
  },
  rejected: {
    label: 'Rechazado',
    style: 'bg-[#FBECE9] text-[#8E2B17] border-[#EABCB3]',
  },
  failed: {
    label: 'Fallido',
    style: 'bg-[#FBECE9] text-[#8E2B17] border-[#EABCB3]',
  },
  active: {
    label: 'Activo',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
  inactive: {
    label: 'Inactivo',
    style: 'bg-[#F3EDE2] text-[#5C6B73] border-[#D2C6B4]',
  },
  closed: {
    label: 'Baja Lógica',
    style: 'bg-[#FBECE9] text-[#8E2B17] border-[#EABCB3]',
  },
  ready: {
    label: 'Listo',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
  not_requested: {
    label: 'PDF no solicitado',
    style: 'bg-[#F3EDE2] text-[#5C6B73] border-[#D2C6B4]',
  },
  accepted: {
    label: 'En preparación (202)',
    style: 'bg-[#FBF4E4] text-[#855814] border-[#E8D2A0]',
  },
  processing: {
    label: 'Procesando',
    style: 'bg-[#FBF4E4] text-[#855814] border-[#E8D2A0]',
  },
  open: {
    label: 'Abierto',
    style: 'bg-[#FBF4E4] text-[#855814] border-[#E8D2A0]',
  },
  authorized: {
    label: 'Autorizado (sin abono)',
    style: 'bg-[#EBF1F6] text-[#1D4663] border-[#C3D6E6]',
  },
  executed: {
    label: 'Devolución Ejecutada',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
  resolved: {
    label: 'Resuelto',
    style: 'bg-[#E7F3EE] text-[#15523F] border-[#B6DEC9]',
  },
};

export const StatusPill: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const key = (status || '').toLowerCase();
  const entry = STATUS_MAP[key] ?? {
    label: status,
    style: 'bg-[#F3EDE2] text-[#12232E] border-[#D2C6B4]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide uppercase ${size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[10px]'
        } ${entry.style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {entry.label}
    </span>
  );
};

export const CountdownPill: React.FC<{ deadlineIso: string }> = ({ deadlineIso }) => {
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    const diff = Math.floor((new Date(deadlineIso).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((new Date(deadlineIso).getTime() - Date.now()) / 1000);
      setRemainingSec(Math.max(0, diff));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [deadlineIso]);

  const mins = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const secs = String(remainingSec % 60).padStart(2, '0');
  const expired = remainingSec <= 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-xs font-semibold ${expired
        ? 'bg-[#FBECE9] border-[#EABCB3] text-[#8E2B17]'
        : 'bg-[#FBF4E4] border-[#E8D2A0] text-[#7A4E0D]'
        }`}
    >
      <Timer className="w-3.5 h-3.5" />
      {expired ? 'Plazo vencido' : `${mins}:${secs} restantes`}
    </span>
  );
};

export const PaginationControls: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  onPageChange: (nextPage: number) => void;
}> = ({ page, pageSize, total, hasNext, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize && page === 1 && !hasNext) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#E5DDD0]">
      <span className="text-xs text-[#5C6B73]">
        Página <strong className="text-[#12232E]">{page}</strong> de{' '}
        <strong className="text-[#12232E]">{totalPages}</strong> · {total} registros
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-[#E5DDD0] bg-[#FFFCF8] text-xs font-semibold text-[#12232E] hover:border-[#B84A27] disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Anterior
        </button>
        <button
          type="button"
          disabled={!hasNext && page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-[#E5DDD0] bg-[#FFFCF8] text-xs font-semibold text-[#12232E] hover:border-[#B84A27] disabled:opacity-40 cursor-pointer"
        >
          Siguiente
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const SectionEyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({
  children,
  light = false,
}) => (
  <span
    className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] ${light ? 'text-[#C89B54]' : 'text-[#B84A27]'
      }`}
  >
    <Compass className="w-3.5 h-3.5" />
    {children}
  </span>
);

export const ExperienceCard: React.FC<{
  offer: CatalogOfferDto;
  seedIndex?: number;
  preferredStartDate?: string;
}> = ({ offer, seedIndex = 0, preferredStartDate }) => {
  const baseHref = offer.type === 'package' ? `/paquetes/${offer.id}` : `/tours/${offer.id}`;
  const detailHref =
    preferredStartDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredStartDate)
      ? `${baseHref}?startDate=${encodeURIComponent(preferredStartDate)}`
      : baseHref;
  const destination = offer.destinationHint || inferDestination(`${offer.name} ${offer.description}`);
  const primaryImg = offer.images.find((i) => i.isPrimary)?.url ?? offer.images[0]?.url;
  const hasDiscount =
    offer.originalPriceHint && parseDecimal(offer.originalPriceHint) > parseDecimal(offer.price);

  return (
    <article className="hairline-card hairline-card-hover rounded-2xl overflow-hidden flex flex-col h-full group">
      <Link
        to={detailHref}
        className="relative block h-60 overflow-hidden bg-[#F3EDE2]"
      >
        <PeruPhoto
          src={primaryImg}
          alt={offer.name}
          category={offer.type === 'package' ? 'package' : 'tour'}
          seedIndex={seedIndex}
          hintText={`${offer.destinationHint ?? ''} ${offer.name} ${offer.description}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720]/55 via-transparent to-transparent" />

        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-[#FFFCF8]/95 text-[#12232E] text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {offer.type === 'package' ? 'Paquete Turístico' : 'Tour Turístico'}
          </span>
          {offer.badgeHint && (
            <span className="px-2.5 py-1 rounded-full bg-[#B84A27] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {offer.badgeHint}
            </span>
          )}
        </div>

        <span className="absolute bottom-3 left-3.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#FAF7F2] drop-shadow">
          <MapPin className="w-3.5 h-3.5 text-[#C89B54]" />
          {destination}, Perú
        </span>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#5C6B73] mb-2.5">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#B84A27]" />
            {offer.durationDays === 1 ? 'Full Day · 1 día' : `${offer.durationDays} días`}
          </span>
          {offer.nextDepartureHint && (
            <span className="text-[#1B5E4A] font-semibold">{offer.nextDepartureHint}</span>
          )}
        </div>

        <Link
          to={detailHref}
          className="font-editorial text-[22px] leading-[1.18] font-medium text-[#12232E] group-hover:text-[#B84A27] transition-colors line-clamp-2"
        >
          {offer.name}
        </Link>

        <p className="text-xs text-[#5C6B73] leading-relaxed mt-2.5 line-clamp-2 flex-1">
          {offer.description}
        </p>

        <div className="mt-5 pt-4 border-t border-[#E5DDD0] flex items-end justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#5C6B73]">
              Tarifa oficial por viajero
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <strong className="font-editorial text-2xl font-semibold text-[#12232E] tabular-nums">
                {formatPen(offer.price)}
              </strong>
              {hasDiscount && (
                <span className="text-xs text-[#5C6B73] line-through tabular-nums">
                  {formatPen(offer.originalPriceHint)}
                </span>
              )}
            </div>
          </div>

          <Link
            to={detailHref}
            aria-label={`Explorar ${offer.name}`}
            className="w-10 h-10 rounded-full border border-[#E5DDD0] bg-[#FAF7F2] text-[#B84A27] group-hover:bg-[#B84A27] group-hover:border-[#B84A27] group-hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export const HotelEditorialCard: React.FC<{
  hotel: HotelPublicItemDto;
  seedIndex?: number;
}> = ({ hotel, seedIndex = 0 }) => {
  const meta = extractHotelEditorialMeta(hotel);
  const primaryImg = hotel.images.find((i) => i.isPrimary)?.url ?? hotel.images[0]?.url;
  const visibleServices = hotel.services.slice(0, 4);
  const remainingServices = Math.max(0, hotel.services.length - visibleServices.length);

  return (
    <article className="hairline-card hairline-card-hover rounded-2xl overflow-hidden flex flex-col h-full group">
      <Link to={`/hoteles/${hotel.id}`} className="relative block h-56 overflow-hidden bg-[#F3EDE2]">
        <PeruPhoto
          src={primaryImg}
          alt={hotel.name}
          category="hotel"
          seedIndex={seedIndex}
          hintText={`${meta.destination} ${hotel.name}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720]/75 via-[#0B1720]/15 to-transparent" />

        <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-1.5">
          {hotel.hasAvailability ? (
            <span className="px-2.5 py-1 rounded-full bg-[#E7F3EE]/95 text-[#15523F] text-[10px] font-bold uppercase tracking-wider shadow-xs">
              Disponible
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-[#FBECE9]/95 text-[#8E2B17] text-[10px] font-bold uppercase tracking-wider shadow-xs">
              Sin disponibilidad
            </span>
          )}

          <span className="px-2.5 py-1 rounded-full bg-[#12232E]/88 backdrop-blur-xs text-[#F2CB88] text-[10px] font-semibold tracking-wide">
            {meta.stars ? `${'★'.repeat(meta.stars)} · ` : ''}
            {meta.categoryBadge}
          </span>
        </div>

        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-[11px] font-medium text-[#FAF7F2]">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#C89B54] shrink-0" />
            <span className="truncate">{meta.proximity}</span>
          </span>
          <span className="text-[10px] text-[#FAF7F2]/80 shrink-0">{meta.destination}</span>
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <Link
          to={`/hoteles/${hotel.id}`}
          className="font-editorial text-[22px] leading-tight font-medium text-[#12232E] group-hover:text-[#B84A27] transition-colors"
        >
          {hotel.name}
        </Link>

        <p className="text-[11px] text-[#5C6B73] mt-1.5 font-medium line-clamp-1">
          {meta.location}
        </p>

        <p className="text-xs text-[#5C6B73] leading-relaxed mt-2 line-clamp-2 flex-1">
          {meta.summaryText}
        </p>

        <div className="mt-3 pt-2.5 border-t border-[#E5DDD0]/70 flex items-center justify-between gap-2 text-[11px] text-[#5C6B73]">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#12232E]">
            <Clock className="w-3.5 h-3.5 text-[#1B5E4A]" />
            Check-in {meta.checkIn} · Out {meta.checkOut}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {visibleServices.map((srv) => (
            <span
              key={srv}
              className="px-2.5 py-1 rounded-md bg-[#F3EDE2] text-[#263D4D] text-[10px] font-medium line-clamp-1"
            >
              {srv}
            </span>
          ))}
          {remainingServices > 0 && (
            <span className="px-2 py-1 rounded-md bg-[#FAF7F2] border border-[#E5DDD0] text-[#5C6B73] text-[10px] font-semibold">
              +{remainingServices} más
            </span>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[#E5DDD0] flex items-end justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#5C6B73]">
              Tarifa base más baja (24h)
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[11px] text-[#5C6B73] font-medium">Desde</span>
              <strong className="font-editorial text-2xl font-semibold text-[#12232E] tabular-nums">
                {hotel.lowestBasePrice ? formatPen(hotel.lowestBasePrice) : 'Consultar'}
              </strong>
            </div>
          </div>

          <Link
            to={`/hoteles/${hotel.id}`}
            aria-label={`Ver detalles de ${hotel.name}`}
            className="w-10 h-10 rounded-full border border-[#E5DDD0] bg-[#FAF7F2] text-[#1B5E4A] group-hover:bg-[#1B5E4A] group-hover:border-[#1B5E4A] group-hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};
