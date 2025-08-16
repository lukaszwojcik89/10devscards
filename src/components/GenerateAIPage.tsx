import React, { useEffect, useState } from "react";
import { GenerateAIModal } from "./generate-ai/GenerateAIModal";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import type { DeckWithCounts } from "../types";

interface GenerateAIPageProps {
  /** Czy strona jest załadowana od razu z otwartym modal */
  autoOpen?: boolean;
}

/**
 * Komponent strony Generator AI
 * Zawiera główny interfejs do generowania fiszek z AI
 */
export function GenerateAIPage({ autoOpen: _autoOpen = true }: GenerateAIPageProps) {
  const [decks, setDecks] = useState<DeckWithCounts[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pobiera listę tali użytkownika
   */
  const fetchDecks = async () => {
    try {
      setIsLoadingDecks(true);
      setError(null);

      // Pobierz token z localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Brak tokena autoryzacji");
      }

      const response = await fetch("/api/decks", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDecks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd pobierania tali");
    } finally {
      setIsLoadingDecks(false);
    }
  };

  /**
   * Otwiera modal Generator AI
   */
  const openGeneratorModal = () => {
    // Otwórz modal przez URL params
    const url = new URL(window.location.href);
    url.searchParams.set("modal", "generate");
    window.history.pushState({}, "", url.toString());

    // Wymuś ponowne sprawdzenie URL params w modal
    window.dispatchEvent(new Event("popstate"));
  };

  /**
   * Callback po udanej generacji - przekierowanie do talii
   */
  const handleGenerationSuccess = (deckSlug: string) => {
    window.location.href = `/decks/${deckSlug}`;
  };

  // Pobierz talie przy załadowaniu
  useEffect(() => {
    fetchDecks();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Generuj fiszki AI</h1>
          <p className="text-gray-600">Stwórz fiszki automatycznie używając sztucznej inteligencji</p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-6 bg-red-50 border-red-200">
            <div className="text-red-900">
              <h3 className="text-lg font-medium">Wystąpił błąd</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button onClick={fetchDecks} variant="outline" className="mt-4">
              Spróbuj ponownie
            </Button>
          </Card>
        )}

        {/* Main Content */}
        <Card className="p-6">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">Gotowy do generowania?</h2>
                <p className="text-gray-600 mt-2">
                  Wklej dowolny tekst, a nasza AI stworzy z niego interaktywne fiszki do nauki.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900">📝 Wklej tekst</div>
                  <div className="text-sm text-gray-600 mt-1">Artykuły, notatki, podręczniki - wszystko się nadaje</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900">⚙️ Dostosuj ustawienia</div>
                  <div className="text-sm text-gray-600 mt-1">Wybierz liczbę kart, poziom trudności i język</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900">🎯 Otrzymaj fiszki</div>
                  <div className="text-sm text-gray-600 mt-1">Sprawdź, edytuj i zapisz gotowe materiały</div>
                </div>
              </div>
            </div>

            <Button onClick={openGeneratorModal} size="lg" className="px-8">
              Rozpocznij generowanie
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">🎯</div>
            <div className="text-sm text-gray-600 mt-1">Precyzyjne AI</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">⚡</div>
            <div className="text-sm text-gray-600 mt-1">Szybka generacja</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">✨</div>
            <div className="text-sm text-gray-600 mt-1">Wysoka jakość</div>
          </div>
        </div>

        {/* Generator AI Modal */}
        <GenerateAIModal
          decks={decks}
          isLoadingDecks={isLoadingDecks}
          triggerSource="navbar"
          onSuccess={handleGenerationSuccess}
        />
      </div>
    </div>
  );
}
