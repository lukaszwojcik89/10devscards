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
      className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h3 className="font-semibold text-gray-900">Witaj{userName ? ` ${userName}` : ""}!</h3>
          </div>
          <p className="text-sm text-gray-600">Miło Cię widzieć. Sprawdź swoje postępy i zaplanuj naukę na dziś.</p>
        </div>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100"
          aria-label="Zamknij powiadomienie"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {autoClose && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
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
