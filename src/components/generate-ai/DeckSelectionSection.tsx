import React from "react";
import { Button } from "../ui/button";
import type { DeckWithCounts, CreateDeckData } from "../../types";

interface DeckSelectionSectionProps {
  decks: DeckWithCounts[];
  selectedDeckId: string | null;
  onSelect: (deckId: string | null) => void;
  showInlineCreate: boolean;
  onToggleInlineCreate: () => void;
  isLoading: boolean;
  validationError?: string;
  newDeckData: CreateDeckData | null;
  onNewDeckDataChange: (data: CreateDeckData | null) => void;
}

/**
 * Sekcja wyboru talii z możliwością inline tworzenia nowej
 */
export function DeckSelectionSection({
  decks,
  selectedDeckId,
  onSelect,
  showInlineCreate,
  onToggleInlineCreate,
  isLoading,
  validationError,
  newDeckData,
  onNewDeckDataChange,
}: DeckSelectionSectionProps) {
  const handleCreateDeck = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newDeckData?.name?.trim()) return;

    // Instead of creating a mock deck, signal that we want to create a new deck
    // This will be handled by the API with "CREATE_NEW" deck_id
    onSelect("CREATE_NEW");
    onToggleInlineCreate(); // Hide inline form
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="deck-selector" className="block text-sm font-medium mb-2">
          Wybierz talię
        </label>

        {!showInlineCreate ? (
          <div className="space-y-2">
            <select
              id="deck-selector"
              value={selectedDeckId || ""}
              onChange={(e) => onSelect(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Wybierz talię...</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.flashcard_count} fiszek)
                </option>
              ))}
            </select>

            <Button type="button" variant="outline" size="sm" onClick={onToggleInlineCreate} className="w-full">
              + Utwórz nową talię
            </Button>
          </div>
        ) : (
          <InlineCreateDeck
            newDeckData={newDeckData}
            onDataChange={onNewDeckDataChange}
            onSubmit={handleCreateDeck}
            onCancel={onToggleInlineCreate}
          />
        )}

        {validationError && <p className="text-sm text-red-600 mt-1">{validationError}</p>}
      </div>
    </div>
  );
}

interface InlineCreateDeckProps {
  newDeckData: CreateDeckData | null;
  onDataChange: (data: CreateDeckData | null) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * Inline formularz do tworzenia nowej talii
 */
function InlineCreateDeck({ newDeckData, onDataChange, onSubmit, onCancel }: InlineCreateDeckProps) {
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    onDataChange({
      ...newDeckData,
      name,
      slug,
    });
  };

  const handleDescriptionChange = (description: string) => {
    if (!newDeckData?.name) return;

    onDataChange({
      name: newDeckData.name,
      slug: newDeckData.slug,
      description: description || undefined,
    });
  };

  const isValid = newDeckData?.name?.trim() && newDeckData.name.length >= 3;

  return (
    <form onSubmit={onSubmit} className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
      <div>
        <label htmlFor="new-deck-name" className="block text-sm font-medium mb-1">
          Nazwa talii *
        </label>
        <input
          id="new-deck-name"
          type="text"
          value={newDeckData?.name || ""}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Wprowadź nazwę talii..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
          required
        />
        {newDeckData?.name && newDeckData.name.length < 3 && (
          <p className="text-sm text-red-600 mt-1">Nazwa musi mieć co najmniej 3 znaki</p>
        )}
      </div>

      <div>
        <label htmlFor="new-deck-description" className="block text-sm font-medium mb-1">
          Opis (opcjonalny)
        </label>
        <textarea
          id="new-deck-description"
          value={newDeckData?.description || ""}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Krótki opis talii..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          maxLength={500}
        />
      </div>

      {newDeckData?.slug && <div className="text-xs text-gray-500">URL: /decks/{newDeckData.slug}</div>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm" disabled={!isValid} className="flex-1">
          Utwórz talię
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">
          Anuluj
        </Button>
      </div>
    </form>
  );
}
