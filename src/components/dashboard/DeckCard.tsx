import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeckCardProps } from "@/types";

/**
 * Karta recent deck z informacjami o talii
 */
export const DeckCard: React.FC<DeckCardProps> = ({ deck, onClick, showStats = true, showLastActivity = true }) => {
  const handleClick = () => {
    onClick(deck.slug);
  };

  const formatLastStudied = (lastStudied: string) => {
    const date = new Date(lastStudied);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "wczoraj";
    if (diffDays <= 7) return `${diffDays} dni temu`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} tygodni temu`;
    return date.toLocaleDateString("pl-PL");
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500">
      <button
        onClick={handleClick}
        className="w-full text-left focus:outline-none"
        aria-label={`Otwórz talię ${deck.name}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-gray-900 truncate">{deck.name}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {showStats && (
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{deck.flashcard_count} fiszek</span>
              {deck.due_count > 0 && <span className="text-orange-600 font-medium">{deck.due_count} do nauki</span>}
              {deck.pending_count > 0 && (
                <span className="text-blue-600 font-medium">{deck.pending_count} oczekujących</span>
              )}
            </div>
          )}
          {showLastActivity && (
            <p className="text-xs text-gray-500">Ostatnio studiowane: {formatLastStudied(deck.last_studied)}</p>
          )}
        </CardContent>
      </button>
    </Card>
  );
};
