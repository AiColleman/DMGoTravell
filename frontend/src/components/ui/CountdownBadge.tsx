import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownBadgeProps {
  deadlineIso: string;
  labelPrefix?: string;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  deadlineIso,
  labelPrefix = 'Plazo de pago',
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const diff = Math.floor((new Date(deadlineIso).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((new Date(deadlineIso).getTime() - Date.now()) / 1000);
      setRemainingSeconds(Math.max(0, diff));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadlineIso]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const expired = remainingSeconds <= 0;
  const urgent = remainingSeconds > 0 && remainingSeconds <= 180;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tabular-nums border ${
        expired
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : urgent
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }`}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      {expired
        ? 'Ventana vencida (liberación automática)'
        : `${labelPrefix}: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} min`}
    </span>
  );
};
