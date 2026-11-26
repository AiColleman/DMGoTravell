import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ProblemDetailsError } from '../api/httpClient';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
  traceId?: string;
}

interface ToastContextValue {
  notifySuccess: (title: string, detail?: string) => void;
  notifyInfo: (title: string, detail?: string) => void;
  notifyError: (error: unknown, fallbackTitle?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5500);
    },
    [dismiss]
  );

  const notifySuccess = useCallback(
    (title: string, detail?: string) => pushToast({ kind: 'success', title, detail }),
    [pushToast]
  );

  const notifyInfo = useCallback(
    (title: string, detail?: string) => pushToast({ kind: 'info', title, detail }),
    [pushToast]
  );

  const notifyError = useCallback(
    (error: unknown, fallbackTitle = 'Operación no completada') => {
      if (error instanceof ProblemDetailsError) {
        const fieldDetail = error.problem.errors?.length
          ? error.problem.errors.map((e) => `${e.field}: ${e.message}`).join(' · ')
          : undefined;
        pushToast({
          kind: 'error',
          title: error.problem.title || fallbackTitle,
          detail: fieldDetail ? `${error.problem.detail} (${fieldDetail})` : error.problem.detail,
          traceId: error.problem.traceId,
        });
        return;
      }

      if (error instanceof Error) {
        pushToast({ kind: 'error', title: fallbackTitle, detail: error.message });
        return;
      }

      pushToast({
        kind: 'error',
        title: fallbackTitle,
        detail: 'Verifica la disponibilidad de la API o intenta nuevamente.',
      });
    },
    [pushToast]
  );

  return (
    <ToastContext.Provider value={{ notifySuccess, notifyInfo, notifyError }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-[min(400px,calc(100vw-2rem))] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-xl border p-4 shadow-xl backdrop-blur-md flex items-start gap-3 transition-all ${
              t.kind === 'error'
                ? 'bg-[#FFF5F3] border-[#E8B4A6] text-[#6E1F0D]'
                : t.kind === 'success'
                  ? 'bg-[#F3FAF7] border-[#B6DEC9] text-[#123F31]'
                  : 'bg-[#FFFCF8] border-[#E5DDD0] text-[#12232E]'
            }`}
          >
            {t.kind === 'error' ? (
              <AlertCircle className="w-5 h-5 text-[#B84A27] shrink-0 mt-0.5" />
            ) : t.kind === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#1B5E4A] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#C89B54] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-snug">{t.title}</p>
              {t.detail && <p className="text-xs opacity-85 mt-1 leading-relaxed">{t.detail}</p>}
              {t.traceId && t.traceId !== 'local' && (
                <p className="font-mono text-[10px] opacity-60 mt-1">Trace: {t.traceId}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar notificación"
              className="opacity-60 hover:opacity-100 cursor-pointer p-0.5"
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
  if (!ctx) throw new Error('useToast debe utilizarse dentro de ToastProvider.');
  return ctx;
}
