import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

function getIcon(kind) {
  if (kind === 'success') return CheckCircle2;
  if (kind === 'error') return XCircle;
  return Info;
}

function getBorderClass(kind) {
  if (kind === 'success') return 'border-[#d4af37]/40';
  if (kind === 'error') return 'border-white/30';
  return 'border-white/20';
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ kind = 'info', title, description, durationMs = 4500, onClick, navigation } = {}) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const toast = { id, kind, title: title || '', description: description || '', onClick, navigation };
      setToasts((prev) => [...prev, toast]);

      if (durationMs > 0) {
        window.setTimeout(() => removeToast(id), durationMs);
      }

      return id;
    },
    [removeToast]
  );

  const handleToastClick = useCallback((toast) => {
    if (toast.onClick) {
      toast.onClick();
    } else if (toast.navigation) {
      navigate(toast.navigation);
    }
    removeToast(toast.id);
  }, [navigate, removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((toast) => {
          const Icon = getIcon(toast.kind);
          const isClickable = toast.onClick || toast.navigation;
          return (
            <div
              key={toast.id}
              className={cn(
                'bg-black/70 border rounded-2xl backdrop-blur-xl px-4 py-3 text-white',
                getBorderClass(toast.kind),
                isClickable && 'cursor-pointer hover:bg-black/80 transition-colors'
              )}
              role="status"
              aria-live="polite"
              onClick={isClickable ? () => handleToastClick(toast) : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <Icon size={18} className="text-[#d4af37]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black break-words whitespace-normal">{toast.title}</div>
                  {toast.description ? (
                    <div className="text-xs text-white/80 mt-1 break-words">{toast.description}</div>
                  ) : null}
                </div>
                <button
                  className="shrink-0 w-8 h-8 -mt-1 -mr-1 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  aria-label="Close"
                  type="button"
                >
                  <X size={14} className="text-white/80" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
