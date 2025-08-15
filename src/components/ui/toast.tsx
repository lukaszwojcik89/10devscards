import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TOAST TYPES & INTERFACES
// =============================================================================

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// =============================================================================
// TOAST CONTEXT
// =============================================================================

import { createContext, useContext } from "react";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// =============================================================================
// TOAST PROVIDER
// =============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// =============================================================================
// TOAST CONTAINER
// =============================================================================

function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// =============================================================================
// TOAST ITEM COMPONENT
// =============================================================================

interface ToastItemProps {
  toast: Toast;
}

const toastVariants = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconVariants = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    // Wait for exit animation before removing
    setTimeout(() => removeToast(toast.id), 300);
  };

  const Icon = iconVariants[toast.variant];

  return (
    <div
      className={cn(
        "border rounded-lg shadow-lg p-4 transition-all duration-300 transform",
        toastVariants[toast.variant],
        isVisible 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-xs font-medium underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
          
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-black/10 rounded transition-colors"
            aria-label="Zamknij powiadomienie"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TOAST HOOKS FOR COMMON PATTERNS
// =============================================================================

export function useAuthToasts() {
  const { addToast } = useToast();

  return {
    loginSuccess: () => {
      addToast({
        message: "Zalogowano pomyślnie! Witamy z powrotem.",
        variant: "success",
        duration: 3000,
      });
    },

    loginError: (message?: string) => {
      addToast({
        message: message || "Błędne dane logowania. Spróbuj ponownie.",
        variant: "error",
        duration: 5000,
      });
    },

    registerSuccess: () => {
      addToast({
        message: "Konto utworzone! Sprawdź email aby potwierdzić rejestrację.",
        variant: "success",
        duration: 6000,
      });
    },

    emailNotConfirmed: () => {
      addToast({
        message: "Potwierdź swój adres email przed zalogowaniem.",
        variant: "warning",
        duration: 5000,
      });
    },

    passwordResetSent: () => {
      addToast({
        message: "Instrukcje resetowania hasła zostały wysłane na email.",
        variant: "info",
        duration: 5000,
      });
    },

    passwordUpdated: () => {
      addToast({
        message: "Hasło zostało pomyślnie zaktualizowane.",
        variant: "success",
        duration: 4000,
      });
    },

    logoutSuccess: () => {
      addToast({
        message: "Wylogowano pomyślnie.",
        variant: "info",
        duration: 3000,
      });
    },

    sessionExpired: () => {
      addToast({
        message: "Sesja wygasła. Zaloguj się ponownie.",
        variant: "warning",
        duration: 5000,
      });
    },

    serverError: () => {
      addToast({
        message: "Wystąpił błąd serwera. Spróbuj ponownie.",
        variant: "error",
        duration: 5000,
      });
    },

    networkError: () => {
      addToast({
        message: "Brak połączenia z internetem. Sprawdź sieć.",
        variant: "error",
        duration: 5000,
      });
    },
  };
}
