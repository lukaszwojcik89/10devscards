import React from "react";
import type { GenerationSettingsProps, GenerationSettings } from "../../types";

/**
 * Sekcja ustawień generacji AI z estymacją kosztów
 */
export function GenerationSettingsSection({
  settings,
  onSettingsChange,
  estimatedCost,
  maxAllowedCards,
}: GenerationSettingsProps) {
  const handleMaxCardsChange = (value: number) => {
    const clampedValue = Math.min(Math.max(1, value), maxAllowedCards);
    onSettingsChange({ maxCards: clampedValue });
  };

  const handleDifficultyChange = (difficulty: GenerationSettings["difficulty"]) => {
    onSettingsChange({ difficulty });
  };

  const handleLanguageChange = (language: GenerationSettings["language"]) => {
    onSettingsChange({ language });
  };

  const handleContextChange = (context: string) => {
    onSettingsChange({ context: context || undefined });
  };

  const getDifficultyDescription = (difficulty: GenerationSettings["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "Proste pytania, podstawowe fakty";
      case "intermediate":
        return "Umiarkowana złożoność, wymaga zrozumienia";
      case "advanced":
        return "Złożone pytania, analiza i synteza";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Ustawienia generacji</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Max Cards */}
        <div>
          <label htmlFor="max-cards" className="block text-sm font-medium mb-2">
            Maksymalna liczba fiszek
          </label>
          <div className="space-y-2">
            <input
              id="max-cards"
              type="number"
              min="1"
              max={maxAllowedCards}
              value={settings.maxCards}
              onChange={(e) => handleMaxCardsChange(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="range"
              min="1"
              max={maxAllowedCards}
              value={settings.maxCards}
              onChange={(e) => handleMaxCardsChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>{maxAllowedCards}</span>
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium mb-2">
            Poziom trudności
          </label>
          <select
            id="difficulty"
            value={settings.difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as GenerationSettings["difficulty"])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="beginner">Początkujący</option>
            <option value="intermediate">Średniozaawansowany</option>
            <option value="advanced">Zaawansowany</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">{getDifficultyDescription(settings.difficulty)}</p>
        </div>
      </div>

      {/* Language Selection */}
      <fieldset>
        <legend className="block text-sm font-medium mb-2">Język fiszek</legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleLanguageChange("pl")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              settings.language === "pl" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Polski
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange("en")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              settings.language === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            English
          </button>
        </div>
      </fieldset>

      {/* Additional Context */}
      <div>
        <label htmlFor="context" className="block text-sm font-medium mb-2">
          Dodatkowy kontekst (opcjonalny)
        </label>
        <textarea
          id="context"
          value={settings.context || ""}
          onChange={(e) => handleContextChange(e.target.value)}
          placeholder="Podaj dodatkowe informacje, które pomogą AI lepiej dostosować fiszki..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">Np. poziom edukacji, specjalizacja, preferencje stylu pytań</p>
          <span className="text-xs text-gray-500">{(settings.context || "").length}/500</span>
        </div>
      </div>

      {/* Cost Estimation */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-900">Szacowany koszt</h4>
            <p className="text-xs text-blue-700 mt-1">Przybliżony koszt generacji {settings.maxCards} fiszek</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-blue-900">${estimatedCost.toFixed(4)}</div>
            <div className="text-xs text-blue-700">USD</div>
          </div>
        </div>

        {estimatedCost > 0.1 && (
          <div className="mt-2 text-xs text-orange-600">
            ⚠️ Wysoki szacowany koszt - rozważ zmniejszenie liczby fiszek
          </div>
        )}
      </div>
    </div>
  );
}
