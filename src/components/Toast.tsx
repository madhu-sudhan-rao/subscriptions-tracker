import { useEffect, useRef, useState, useCallback } from 'react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => <ToastPill key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

const DOT_COLORS: Record<ToastData['type'], string> = {
  success: '#30d158',
  error:   '#ff375f',
  warning: '#ff9f0a',
  info:    '#0a84ff',
};

function ToastPill({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className="toast-pill" role="alert" onClick={() => onRemove(toast.id)}>
      <div className="toast-dot" style={{ background: DOT_COLORS[toast.type] }} />
      <span className="toast-msg">{toast.message}</span>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((message: string, type: ToastData['type'] = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((p) => [...p, { id, message, type, duration }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}
