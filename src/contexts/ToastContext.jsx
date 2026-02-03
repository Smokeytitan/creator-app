import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Toast Context Provider
 * Provides toast notification functionality throughout the app
 *
 * Usage:
 * 1. Wrap your app with <ToastProvider>
 * 2. Use the useToast() hook in any component
 *
 * Example:
 * const { showToast } = useToast();
 * showToast('Success!', 'success');
 * showToast('Error occurred', 'error');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();

    const newToast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container Component
 * Renders all active toasts
 */
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 */
function Toast({ toast, onClose }) {
  const { message, type } = toast;

  // Icon based on toast type
  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[type] || Info;

  // Color classes based on toast type
  const colorClasses = {
    success: 'bg-green-900/90 border-green-500/50 text-green-100',
    error: 'bg-red-900/90 border-red-500/50 text-red-100',
    warning: 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100',
    info: 'bg-blue-900/90 border-blue-500/50 text-blue-100',
  }[type] || 'bg-blue-900/90 border-blue-500/50 text-blue-100';

  const iconColorClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }[type] || 'text-blue-400';

  return (
    <div
      className={`
        ${colorClasses}
        rounded-lg border backdrop-blur-sm
        shadow-lg p-4 pr-12
        flex items-start gap-3
        animate-slide-in-right
        relative
        min-w-[320px]
      `}
      role="alert"
    >
      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorClasses}`} />

      {/* Message */}
      <div className="flex-1">
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * useToast Hook
 * Provides access to toast functions
 *
 * Returns:
 * - showToast(message, type, duration): Show a new toast
 * - removeToast(id): Manually remove a toast
 * - clearAllToasts(): Clear all toasts
 * - success(message): Shorthand for success toast
 * - error(message): Shorthand for error toast
 * - warning(message): Shorthand for warning toast
 * - info(message): Shorthand for info toast
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast, removeToast, clearAllToasts } = context;

  // Convenience methods
  const success = useCallback(
    (message, duration) => showToast(message, 'success', duration),
    [showToast]
  );

  const error = useCallback(
    (message, duration = 7000) => showToast(message, 'error', duration),
    [showToast]
  );

  const warning = useCallback(
    (message, duration) => showToast(message, 'warning', duration),
    [showToast]
  );

  const info = useCallback(
    (message, duration) => showToast(message, 'info', duration),
    [showToast]
  );

  return {
    showToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}

export default ToastContext;
