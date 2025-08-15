import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToastWelcomeProps } from "@/types";

/**
 * Jednorazowy toast powitalny wyświetlany po pierwszym logowaniu w sesji
 */
export const ToastWelcome: React.FC<ToastWelcomeProps> = ({
  userName,
  onDismiss,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onDismiss]);

  return (
    <div
      className="fixed right-4 z-50 max-w-xs w-80 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex flex-col items-start animate-in slide-in-from-top-2"
      style={{ top: "var(--navbar-height)" }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 w-full min-h-[32px]">
        <span className="text-xl">👋</span>
        <span className="font-semibold text-gray-900 text-sm truncate">Witaj! Miło Cię widzieć.</span>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100 ml-auto"
          aria-label="Zamknij powiadomienie"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {autoClose && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full"
            style={{
              animation: `shrink-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes shrink-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
