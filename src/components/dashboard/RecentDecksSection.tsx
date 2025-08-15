import React from "react";
import { Button } from "@/components/ui/button";
import { DeckCard } from "./DeckCard";
import type { RecentDecksSectionProps } from "@/types";

/**
 * Sekcja pokazująca ostatnio używane talie z opcją przejścia do pełnej listy
 */
export const RecentDecksSection: React.FC<RecentDecksSectionProps> = ({
  recentDecks,
  onDeckClick,
  onViewAll,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section aria-labelledby="recent-decks-title" className="space-y-4">
        <h2 id="recent-decks-title" className="text-xl font-semibold text-gray-900">
          Ostatnie talie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (recentDecks.length === 0) {
    return (
      <section aria-labelledby="recent-decks-title" className="space-y-4">
        <h2 id="recent-decks-title" className="text-xl font-semibold text-gray-900">
          Ostatnie talie
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych talii</p>
          <Button onClick={onViewAll} variant="outline">
            Utwórz pierwszą talię
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="recent-decks-title" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="recent-decks-title" className="text-xl font-semibold text-gray-900">
          Ostatnie talie
        </h2>
        {recentDecks.length > 0 && (
          <Button onClick={onViewAll} variant="outline" size="sm">
            Zobacz wszystkie
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentDecks.slice(0, 5).map((deck) => (
          <DeckCard key={deck.id} deck={deck} onClick={onDeckClick} showStats={true} showLastActivity={true} />
        ))}
      </div>

      {recentDecks.length > 5 && (
        <div className="text-center pt-4">
          <Button onClick={onViewAll} variant="ghost">
            Zobacz pozostałe {recentDecks.length - 5} talii
          </Button>
        </div>
      )}
    </section>
  );
};
