import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  onPageChange: (nextPage: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  pageSize,
  total,
  hasNext,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
      <p className="text-xs text-slate-500 tabular-nums">
        Página <strong className="text-slate-800">{page}</strong> de{' '}
        <strong className="text-slate-800">{totalPages}</strong> · Total de registros:{' '}
        <strong className="text-slate-800">{total}</strong> ({pageSize} por página)
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <span className="px-3.5 py-2 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold tabular-nums">
          {page}
        </span>
        <button
          type="button"
          disabled={!hasNext && page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
