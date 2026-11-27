import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const MotionDiv = motion.div;

const ToastContext = createContext({ pushToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, description, type = 'info', duration = 3800 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, type }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon =
              toast.type === 'success'
                ? CheckCircle2
                : toast.type === 'error'
                  ? AlertTriangle
                  : Info;
            const accent =
              toast.type === 'success'
                ? 'border-cyan-400/45 text-cyan-400'
                : toast.type === 'error'
                  ? 'border-orange-500/40 text-orange-400'
                  : 'border-violet-500/40 text-violet-400';

            return (
              <MotionDiv
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className={`pointer-events-auto glass-card-strong rounded-xl border p-3.5 shadow-xl ${accent}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1 text-slate-900 dark:text-slate-100">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description && (
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {toast.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    aria-label="Dismiss notification"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-500/15 hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </MotionDiv>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
