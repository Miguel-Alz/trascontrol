import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'border-l-emerald-500 text-emerald-500',
  error: 'border-l-red-500 text-red-500',
  warning: 'border-l-amber-500 text-amber-500',
  info: 'border-l-blue-500 text-blue-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = TOAST_DURATION }) => {
    const id = Date.now().toString();
    const toast = { id, type, title, message };
    
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-9999 flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = toastIcons[t.type];
          return (
            <div
              key={t.id}
              className={`
                flex items-center gap-3 px-4 py-3
                bg-slate-900 border border-slate-700/50 border-l-4
                rounded-lg shadow-xl min-w-75 max-w-112.5
                animate-slideInRight
                ${toastColors[t.type]}
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{t.title}</p>
                {t.message && (
                  <p className="text-slate-400 text-sm">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
}
