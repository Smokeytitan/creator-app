import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Toast Notification System
 * Provides toast notifications with auto-dismiss and manual close functionality
 *
 * Usage:
 * 1. Wrap your app with <ToastProvider>
 * 2. Use useToast() hook in any component
 *
 * Example:
 * const toast = useToast();
 * toast.success('Campaign created!');
 * toast.error('Failed to save');
 */

/**
 * Toast Provider Component
 * Manages toast state and provides context
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();

    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration = 7000) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container Component
 * Renders all active toasts in a fixed position
 */
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 * Displays a single toast notification with icon, message, and close button
 */
export function Toast({ toast, onClose }) {
  const { message, type } = toast;

  // Icon mapping for each toast type
  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = iconMap[type] || Info;

  // Color classes for each toast variant
  const variantClasses = {
    success: 'bg-green-900/90 border-green-500/50 text-green-100',
    error: 'bg-red-900/90 border-red-500/50 text-red-100',
    warning: 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100',
    info: 'bg-blue-900/90 border-blue-500/50 text-blue-100'
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  const colorClass = variantClasses[type] || variantClasses.info;
  const iconClass = iconClasses[type] || iconClasses.info;

  return (
    <div
      className={`
        ${colorClass}
        rounded-lg border backdrop-blur-sm
        shadow-lg p-4 pr-12
        flex items-start gap-3
        animate-slide-in-right
        relative
        min-w-[320px]
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClass}`} />

      {/* Message */}
      <div className="flex-1">
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-current opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-1 rounded"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * useToast Hook
 * Provides access to toast notification functions
 *
 * Returns:
 * - success(message, duration): Show success toast (green)
 * - error(message, duration): Show error toast (red, 7s default)
 * - warning(message, duration): Show warning toast (yellow)
 * - info(message, duration): Show info toast (blue)
 * - removeToast(id): Manually remove a toast by ID
 *
 * @returns {object} Toast functions
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export default Toast;
