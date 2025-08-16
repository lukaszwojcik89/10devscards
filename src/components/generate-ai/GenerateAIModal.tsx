import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useGenerateAIModal } from "../../hooks/useGenerateAIModal";
import { useBudgetMonitoring } from "../../hooks/useBudgetMonitoring";
import { useFlashcardGeneration } from "../../hooks/useFlashcardGeneration";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DeckSelectionSection } from "./DeckSelectionSection";
import { TextInputSection } from "./TextInputSection";
import { GenerationSettingsSection } from "./GenerationSettingsSection";
import type { DeckWithCounts, GenerationProgress, GenerationError } from "../../types";

interface GenerateAIModalProps {
  decks: DeckWithCounts[];
  isLoadingDecks: boolean;
  preselectedDeckId?: string;
  triggerSource?: "dashboard" | "decks" | "deck-detail" | "navbar";
  onSuccess?: (deckSlug: string) => void;
  onDeckCreated?: () => void;
}

/**
 * Modal do generowania fiszek z AI
 * Obsługuje cały workflow od wyboru talii po podgląd wyników
 */
export function GenerateAIModal({
  decks,
  isLoadingDecks,
  preselectedDeckId,
  triggerSource = "dashboard",
  onSuccess,
  onDeckCreated,
}: GenerateAIModalProps) {
  const { modalState, actions, computed } = useGenerateAIModal();
  const { budgetInfo, calculateEstimatedCost } = useBudgetMonitoring();
  const { generateFlashcards } = useFlashcardGeneration();

  // Oblicz maksymalną liczbę kart na podstawie budżetu
  const calculateMaxAllowedCards = useCallback(() => {
    if (!budgetInfo) return 20; // Fallback gdy budżet nie jest załadowany

    const remainingBudget = budgetInfo.monthlyLimit - budgetInfo.currentSpend;
    const estimatedCostPerCard = calculateEstimatedCost({
      maxCards: 1,
      difficulty: modalState.generationSettings.difficulty,
      language: modalState.generationSettings.language,
      context: modalState.generationSettings.context,
    });

    if (estimatedCostPerCard <= 0) return 20; // Fallback gdy nie można obliczyć kosztu

    const maxAffordableCards = Math.floor(remainingBudget / estimatedCostPerCard);
    return Math.min(Math.max(1, maxAffordableCards), 20); // Min 1, max 20 kart
  }, [budgetInfo, calculateEstimatedCost, modalState.generationSettings]);

  const maxAllowedCards = calculateMaxAllowedCards();

  // Handle URL params for deep linking
  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const modalParam = urlParams.get("modal");
      const deckParam = urlParams.get("deck");

      console.log("checkUrlParams", { modalParam, deckParam, isOpen: modalState.isOpen });

      if (modalParam === "generate" && !modalState.isOpen) {
        console.log("Opening modal from URL params");
        actions.openModal(triggerSource, deckParam || preselectedDeckId);
      }
    };

    // Check on component mount
    console.log("useEffect mounted, checking URL params");
    checkUrlParams();

    // Listen for URL changes
    const handlePopState = () => {
      console.log("popstate event");
      checkUrlParams();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [preselectedDeckId, triggerSource, modalState.isOpen, actions]);

  // Prawdziwa funkcja generacji z API
  const handleGenerate = useCallback(async () => {
    console.log("handleGenerate called", {
      selectedDeckId: modalState.selectedDeckId,
      newDeckData: modalState.newDeckData,
      inputText: modalState.inputText.substring(0, 50) + "...",
      canGenerate: computed.canGenerate,
    });

    try {
      // Przygotuj request DTO
      const request = {
        deck_id: modalState.selectedDeckId || "CREATE_NEW",
        input_text: modalState.inputText,
        max_cards: modalState.generationSettings.maxCards,
        difficulty: modalState.generationSettings.difficulty,
        language: modalState.generationSettings.language,
        context: modalState.generationSettings.context,
      };

      console.log("Sending generation request", request);

      // Callback dla aktualizacji progress
      const onProgressUpdate = (progress: GenerationProgress) => {
        actions.setGenerationState(true, progress);
      };

      // Wywołaj prawdziwe API
      const result = await generateFlashcards(request, onProgressUpdate);

      console.log("Generation completed", result);

      // Zapisz deck_slug dla późniejszego użycia
      localStorage.setItem("lastGeneratedDeckSlug", result.deckSlug);

      // Ustaw wyniki
      actions.setGenerationResults(result.flashcards, result.summary);
    } catch (err) {
      // Obsłuż błąd - rzutuj na GenerationError lub stwórz nowy
      const error = err as GenerationError;
      console.error("Generation error", error);
      actions.setError({
        type: error.type || "unknown",
        code: error.code || "GENERATION_ERROR",
        message: error.message || "Wystąpił błąd podczas generacji",
        isRetryable: error.isRetryable !== false, // domyślnie true
      });
    }
  }, [modalState, actions, generateFlashcards, computed.canGenerate]);

  const handleSave = useCallback(async () => {
    // Pobierz zapisany deck_slug z localStorage
    const deckSlug = localStorage.getItem("lastGeneratedDeckSlug");

    // Wyczyść modal
    actions.closeModal(false);

    // Przekieruj na prawdziwą talię
    if (onSuccess && deckSlug) {
      onSuccess(deckSlug);
    } else if (deckSlug) {
      // Fallback - bezpośrednie przekierowanie
      setTimeout(() => {
        window.location.assign(`/decks/${deckSlug}`);
      }, 0);
    }

    // Wyczyść localStorage
    localStorage.removeItem("lastGeneratedDeckSlug");
  }, [actions, onSuccess]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to close modal
      if (event.key === "Escape") {
        event.preventDefault();
        actions.closeModal();
      }

      // Ctrl/Cmd + Enter to generate or save
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (modalState.step === "input" && computed.canGenerate) {
          handleGenerate();
        } else if (modalState.step === "preview" && computed.selectedCardsCount > 0) {
          handleSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    modalState.isOpen,
    modalState.step,
    computed.canGenerate,
    computed.selectedCardsCount,
    actions,
    handleGenerate,
    handleSave,
  ]);

  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 cursor-default"
        onClick={() => actions.closeModal()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.closeModal();
          }
        }}
        aria-label="Zamknij modal"
      />

      {/* Modal Container */}
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Generuj fiszki AI</h2>
            <p className="text-sm text-gray-600 mt-1">Wklej tekst i pozwól AI stworzyć fiszki do nauki</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => actions.closeModal()} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Zamknij</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {modalState.step === "input" && (
            <div className="space-y-6">
              {/* Deck Selection */}
              <DeckSelectionSection
                decks={decks}
                selectedDeckId={modalState.selectedDeckId}
                onSelect={actions.setDeck}
                showInlineCreate={modalState.showInlineCreate}
                onToggleInlineCreate={actions.toggleInlineCreate}
                isLoading={isLoadingDecks}
                validationError={modalState.validationErrors.deckSelection}
                newDeckData={modalState.newDeckData}
                onNewDeckDataChange={actions.setNewDeckData}
                onDeckCreated={onDeckCreated}
              />

              {/* Text Input */}
              <TextInputSection
                inputText={modalState.inputText}
                onTextChange={actions.setInputText}
                maxLength={2000}
                placeholder="Wklej tutaj tekst, z którego AI ma wygenerować fiszki..."
                isDisabled={modalState.isGenerating}
                validationError={modalState.validationErrors.inputText}
                validationRules={{
                  minLength: 10,
                  maxLength: 2000,
                  required: true,
                }}
              />

              {/* Generation Settings */}
              <GenerationSettingsSection
                settings={modalState.generationSettings}
                onSettingsChange={actions.setGenerationSettings}
                estimatedCost={computed.estimatedCost}
                maxAllowedCards={maxAllowedCards}
              />
            </div>
          )}

          {modalState.step === "generating" && (
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <div>
                <h3 className="text-lg font-medium">
                  {modalState.generationProgress?.statusMessage || "Generowanie fiszek..."}
                </h3>
                {modalState.generationProgress && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(modalState.generationProgress.current / modalState.generationProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round((modalState.generationProgress.current / modalState.generationProgress.total) * 100)}%
                      ukończone
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {modalState.step === "preview" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-900">
                  Wygenerowano {modalState.generatedFlashcards.length} fiszek!
                </h3>
                {modalState.generationSummary && (
                  <p className="text-sm text-green-700 mt-1">
                    Koszt: ${modalState.generationSummary.totalCost.toFixed(4)} | Tokeny:{" "}
                    {modalState.generationSummary.totalTokens} | Czas:{" "}
                    {(modalState.generationSummary.generationTime / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {modalState.generatedFlashcards.map((flashcard) => (
                  <Card key={flashcard.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">Q: {flashcard.question}</div>
                        <div className="text-gray-600 mt-1">A: {flashcard.answer}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={modalState.selectedCards.includes(flashcard.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const newSelection = isChecked
                            ? [...modalState.selectedCards, flashcard.id]
                            : modalState.selectedCards.filter((id) => id !== flashcard.id);
                          actions.updateCardSelection(newSelection);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {modalState.step === "error" && modalState.error && (
            <div className="text-center space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-900">Wystąpił błąd podczas generacji</h3>
                <p className="text-sm text-red-700 mt-1">{modalState.error.message}</p>
              </div>
              <Button onClick={() => actions.setStep("input")} variant="outline">
                Spróbuj ponownie
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {modalState.step === "input" && <span>Ctrl/Cmd + Enter aby wygenerować</span>}
            {modalState.step === "preview" && <span>Wybrano {computed.selectedCardsCount} fiszek</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => actions.closeModal()}>
              Anuluj
            </Button>
            {modalState.step === "input" && (
              <Button
                onClick={handleGenerate}
                disabled={!computed.canGenerate || modalState.isGenerating}
                title={
                  !computed.canGenerate
                    ? `Debug: Text length: ${modalState.inputText.length}, Deck selected: ${modalState.selectedDeckId !== null}, New deck: ${modalState.newDeckData !== null}, Generating: ${modalState.isGenerating}`
                    : "Kliknij aby wygenerować fiszki"
                }
              >
                Generuj fiszki
              </Button>
            )}
            {modalState.step === "preview" && (
              <Button onClick={handleSave} disabled={computed.selectedCardsCount === 0}>
                Zapisz fiszki ({computed.selectedCardsCount})
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
