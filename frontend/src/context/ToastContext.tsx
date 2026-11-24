import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ProblemDetailsError } from '../api/httpClient';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  code?: string;
  traceId?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (item: Omit<ToastItem, 'id'>) => void;
  notifySuccess: (title: string, message: string) => void;
  notifyError: (error: unknown, fallbackTitle?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { ...item, id }]);
      window.setTimeout(() => dismiss(id), 6500);
    },
    [dismiss]
  );

  const notifySuccess = useCallback(
    (title: string, message: string) => {
      notify({ title, message, variant: 'success' });
    },
    [notify]
  );

  const notifyError = useCallback(
    (error: unknown, fallbackTitle = 'Operación rechazada') => {
      if (error instanceof ProblemDetailsError) {
        const fieldText = error.problem.errors?.length
          ? ` (${error.problem.errors.map((e) => `${e.field}: ${e.message}`).join(' · ')})`
          : '';
        const blockerText = error.problem.blockers?.length
          ? ` Bloqueos activos: ${error.problem.blockers
              .map((b) => `${b.type} [${b.reference}] (${b.status})`)
              .join(', ')}`
          : '';
        notify({
          title: error.problem.title || fallbackTitle,
          message: `${error.problem.detail}${fieldText}${blockerText}`,
          code: error.problem.code,
          traceId: error.problem.traceId,
          variant: 'error',
        });
        return;
      }

      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      notify({ title: fallbackTitle, message, variant: 'error' });
    },
    [notify]
  );

  return (
    <ToastContext.Provider value={{ notify, notifySuccess, notifyError }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all flex items-start gap-3 ${
              toast.variant === 'success'
                ? 'bg-white/95 border-emerald-200 text-slate-900'
                : toast.variant === 'error'
                ? 'bg-white/95 border-rose-200 text-slate-900'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            {toast.variant === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[#146C53] shrink-0 mt-0.5" />
            )}
            {toast.variant === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            {toast.variant === 'info' && (
              <Info className="w-5 h-5 text-[#0B3B5B] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold text-sm text-slate-900">{toast.title}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                {toast.message}
              </p>
              {(toast.code || toast.traceId) && (
                <p className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
                  {toast.code ? `código: ${toast.code}` : ''}{' '}
                  {toast.traceId ? `· traceId: ${toast.traceId}` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe utilizarse dentro de ToastProvider.');
  }
  return ctx;
}
