import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, { label: string; classes: string; dot: string }> = {
  // Estados comerciales exclusivos de Reserva (Spec 001 / RN-04 / RN-14)
  pending: {
    label: 'Pendiente de pago',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  confirmed: {
    label: 'Confirmada',
    classes: 'bg-emerald-50 text-[#146C53] border-emerald-200',
    dot: 'bg-[#146C53]',
  },
  completed: {
    label: 'Completada',
    classes: 'bg-sky-50 text-[#0B3B5B] border-sky-200',
    dot: 'bg-[#0B3B5B]',
  },
  cancelled: {
    label: 'Cancelada',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },

  // Estados técnicos de pagos, devoluciones, cuentas y catálogo
  approved: {
    label: 'Aprobado Culqi',
    classes: 'bg-emerald-50 text-[#146C53] border-emerald-200',
    dot: 'bg-[#146C53]',
  },
  sent: {
    label: 'Enviado a pasarela',
    classes: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
  },
  unknown: {
    label: 'En verificación',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  rejected: {
    label: 'Rechazado',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  open: {
    label: 'Caso abierto',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  authorized: {
    label: 'Autorizado',
    classes: 'bg-sky-50 text-[#0B3B5B] border-sky-200',
    dot: 'bg-[#0B3B5B]',
  },
  in_progress: {
    label: 'En curso',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500 animate-pulse',
  },
  executed: {
    label: 'Ejecutado',
    classes: 'bg-emerald-50 text-[#146C53] border-emerald-200',
    dot: 'bg-[#146C53]',
  },
  active: {
    label: 'Activo',
    classes: 'bg-emerald-50 text-[#146C53] border-emerald-200',
    dot: 'bg-[#146C53]',
  },
  inactive: {
    label: 'Inactivo / Borrador',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  deleted: {
    label: 'Cerrada (Baja lógica)',
    classes: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
  },
  closed: {
    label: 'Cerrada (Baja lógica)',
    classes: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
  },
  ready: {
    label: 'Listo para descarga',
    classes: 'bg-emerald-50 text-[#146C53] border-emerald-200',
    dot: 'bg-[#146C53]',
  },
  success: {
    label: 'Éxito',
    classes: 'bg-emerald-50 text-[#146C53] border-emerald-200',
    dot: 'bg-[#146C53]',
  },
  failure: {
    label: 'Fallo / Rechazo',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const key = (status || '').toLowerCase();
  const config = STATUS_MAP[key] ?? {
    label: status || 'Desconocido',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
