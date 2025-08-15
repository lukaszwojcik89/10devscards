import React from "react";
import { Plus, Zap, BookOpen } from "lucide-react";
import { QuickActionButton } from "./QuickActionButton";
import type { QuickActionsSectionProps } from "@/types";

/**
 * Sekcja z przyciskami do najważniejszych akcji aplikacji
 */
export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ quickActions, onActionClick }) => {
  const actions = [
    {
      id: "new-session",
      title: "Nowa sesja",
      description: "Rozpocznij naukę fiszek",
      icon: BookOpen,
      isDisabled: !quickActions.can_start_session,
      disabledReason: quickActions.can_start_session ? undefined : "Brak fiszek do nauki",
      variant: "primary" as const,
    },
    {
      id: "generate-ai",
      title: "Generuj AI",
      description: "Stwórz fiszki automatycznie",
      icon: Zap,
      isDisabled: !quickActions.can_generate_ai,
      disabledReason: quickActions.can_generate_ai ? undefined : "Limit AI wyczerpany",
      variant: "secondary" as const,
    },
    {
      id: "create-deck",
      title: "Nowa talia",
      description: "Dodaj nową talię fiszek",
      icon: Plus,
      isDisabled: false,
      variant: "secondary" as const,
    },
  ];

  return (
    <section aria-labelledby="quick-actions-title" className="space-y-4">
      <h2 id="quick-actions-title" className="text-xl font-semibold text-gray-900">
        Szybkie akcje
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <QuickActionButton
            key={action.id}
            title={action.title}
            description={action.description}
            icon={action.icon}
            onClick={() => onActionClick(action.id)}
            isDisabled={action.isDisabled}
            variant={action.variant}
            disabledReason={action.disabledReason}
          />
        ))}
      </div>

      {quickActions.has_pending_reviews && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Podpowiedź:</strong> Masz oczekujące fiszki do zatwierdzenia. Sprawdź je w sekcji
            &ldquo;Talie&rdquo; aby kontynuować naukę.
          </p>
        </div>
      )}
    </section>
  );
};
