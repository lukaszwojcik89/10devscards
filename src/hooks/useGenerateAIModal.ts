import { useState, useCallback, useMemo } from "react";
import type {
  GenerateAIModalState,
  GenerationSettings,
  CreateDeckData,
  FlashcardPreview,
  ValidationErrors,
  GenerationError,
  GenerationSummary,
  GenerationProgress,
} from "../types";

/**
 * Custom hook dla zarządzania stanem modal Generator AI
 * Obsługuje cały workflow od otwarcia modal, przez generację, po zamknięcie
 */
export function useGenerateAIModal() {
  // Początkowy stan modal - w useMemo żeby nie był recreated
  const initialState = useMemo<GenerateAIModalState>(
    () => ({
      // Modal control
      isOpen: false,
      step: "input",
      triggerSource: "dashboard",

      // Form data
      selectedDeckId: null,
      newDeckData: null,
      inputText: "",
      generationSettings: {
        maxCards: 5,
        difficulty: "intermediate",
        language: "pl",
        context: "",
      },

      // Generation state
      isGenerating: false,
      generationProgress: null,

      // Results data
      generatedFlashcards: [],
      generationSummary: null,
      selectedCards: [],

      // Error handling
      error: null,
      validationErrors: {},

      // UI state
      showInlineCreate: false,
      budgetWarningDismissed: false,
    }),
    []
  );

  const [modalState, setModalState] = useState<GenerateAIModalState>(initialState);

  /**
   * Otwiera modal z opcjonalnym preselection deck
   */
  const openModal = useCallback(
    (triggerSource: GenerateAIModalState["triggerSource"] = "dashboard", preselectedDeckId?: string) => {
      setModalState((prev) => ({
        ...prev,
        isOpen: true,
        triggerSource,
        selectedDeckId: preselectedDeckId || null,
        step: "input",
        error: null,
        validationErrors: {},
      }));

      // Update URL for deep linking
      const url = new URL(window.location.href);
      url.searchParams.set("modal", "generate");
      if (preselectedDeckId) {
        url.searchParams.set("deck", preselectedDeckId);
      }
      window.history.pushState({}, "", url.toString());
    },
    []
  );

  /**
   * Zamyka modal z opcjonalnym potwierdzeniem niezapisanych zmian
   */
  const closeModal = useCallback(
    (confirmUnsaved = true) => {
      const hasUnsavedChanges = modalState.inputText.length > 0 || modalState.generatedFlashcards.length > 0;

      if (confirmUnsaved && hasUnsavedChanges && modalState.step !== "preview") {
        const shouldClose = window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz zamknąć generator?");
        if (!shouldClose) return;
      }

      setModalState(initialState);

      // Remove modal from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("modal");
      url.searchParams.delete("deck");
      window.history.pushState({}, "", url.toString());
    },
    [modalState.inputText.length, modalState.generatedFlashcards.length, modalState.step, initialState]
  );

  /**
   * Ustawia aktualny step modal
   */
  const setStep = useCallback((step: GenerateAIModalState["step"]) => {
    setModalState((prev) => ({
      ...prev,
      step,
      error: step === "input" ? null : prev.error, // Clear error when going back to input
    }));
  }, []);

  /**
   * Ustawia wybraną talię
   */
  const setDeck = useCallback((deckId: string | null) => {
    setModalState((prev) => ({
      ...prev,
      selectedDeckId: deckId,
      newDeckData: deckId ? null : prev.newDeckData, // Clear newDeckData if selecting existing deck
      validationErrors: {
        ...prev.validationErrors,
        deckSelection: undefined,
      },
    }));
  }, []);

  /**
   * Ustawia tekst input
   */
  const setInputText = useCallback((text: string) => {
    setModalState((prev) => ({
      ...prev,
      inputText: text,
      validationErrors: {
        ...prev.validationErrors,
        inputText: undefined,
      },
    }));
  }, []);

  /**
   * Ustawia ustawienia generacji
   */
  const setGenerationSettings = useCallback((settings: Partial<GenerationSettings>) => {
    setModalState((prev) => ({
      ...prev,
      generationSettings: {
        ...prev.generationSettings,
        ...settings,
      },
    }));
  }, []);

  /**
   * Przełącza tryb inline create deck
   */
  const toggleInlineCreate = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      showInlineCreate: !prev.showInlineCreate,
      selectedDeckId: prev.showInlineCreate ? prev.selectedDeckId : null,
      newDeckData: prev.showInlineCreate ? null : prev.newDeckData,
    }));
  }, []);

  /**
   * Ustawia dane nowej talii
   */
  const setNewDeckData = useCallback((data: CreateDeckData | null) => {
    setModalState((prev) => ({
      ...prev,
      newDeckData: data,
      selectedDeckId: data ? null : prev.selectedDeckId,
    }));
  }, []);

  /**
   * Resetuje formularz do stanu początkowego
   */
  const resetForm = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      ...initialState,
      isOpen: prev.isOpen, // Preserve open state
      triggerSource: prev.triggerSource, // Preserve trigger source
    }));
  }, [initialState]);

  /**
   * Ustawia stan generacji
   */
  const setGenerationState = useCallback((isGenerating: boolean, progress?: GenerationProgress | null) => {
    setModalState((prev) => ({
      ...prev,
      isGenerating,
      generationProgress: progress || null,
      step: isGenerating ? "generating" : prev.step,
    }));
  }, []);

  /**
   * Ustawia wyniki generacji
   */
  const setGenerationResults = useCallback((flashcards: FlashcardPreview[], summary: GenerationSummary) => {
    const selectedCards = flashcards.map((card) => card.id);
    setModalState((prev) => ({
      ...prev,
      generatedFlashcards: flashcards,
      generationSummary: summary,
      selectedCards,
      step: "preview",
      isGenerating: false,
      generationProgress: null,
      error: null,
    }));
  }, []);

  /**
   * Ustawia błąd generacji
   */
  const setError = useCallback((error: GenerationError | null) => {
    setModalState((prev) => ({
      ...prev,
      error,
      step: error ? "error" : prev.step,
      isGenerating: false,
      generationProgress: null,
    }));
  }, []);

  /**
   * Ustawia błędy walidacji
   */
  const setValidationErrors = useCallback((errors: ValidationErrors) => {
    setModalState((prev) => ({
      ...prev,
      validationErrors: errors,
    }));
  }, []);

  /**
   * Aktualizuje selekcję kart
   */
  const updateCardSelection = useCallback((cardIds: string[]) => {
    setModalState((prev) => ({
      ...prev,
      selectedCards: cardIds,
    }));
  }, []);

  /**
   * Edytuje pojedynczą kartę
   */
  const editCard = useCallback((cardId: string, updates: Partial<FlashcardPreview>) => {
    setModalState((prev) => ({
      ...prev,
      generatedFlashcards: prev.generatedFlashcards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ...updates,
              isEdited: true,
            }
          : card
      ),
    }));
  }, []);

  /**
   * Przełącza dismissal banner budżetu
   */
  const toggleBudgetWarningDismissed = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      budgetWarningDismissed: !prev.budgetWarningDismissed,
    }));
  }, []);

  // Computed values
  const computed = useMemo(
    () => ({
      /**
       * Czy można rozpocząć generację
       */
      canGenerate:
        modalState.inputText.trim().length > 10 &&
        modalState.inputText.length <= 2000 &&
        (modalState.selectedDeckId !== null || modalState.newDeckData !== null) &&
        !modalState.isGenerating,

      /**
       * Szacowany koszt generacji (mock implementation)
       */
      estimatedCost: modalState.inputText.length * 0.0001 * modalState.generationSettings.maxCards,

      /**
       * Liczba wybranych kart
       */
      selectedCardsCount: modalState.selectedCards.length,

      /**
       * Czy są niezapisane zmiany
       */
      hasUnsavedChanges:
        modalState.inputText.length > 0 || modalState.generatedFlashcards.length > 0 || modalState.newDeckData !== null,

      /**
       * Czy modal jest w trybie loading
       */
      isLoading: modalState.isGenerating,

      /**
       * Czy są błędy walidacji
       */
      hasValidationErrors: Object.keys(modalState.validationErrors).length > 0,
    }),
    [modalState]
  );

  return {
    modalState,
    actions: {
      openModal,
      closeModal,
      setStep,
      setDeck,
      setInputText,
      setGenerationSettings,
      toggleInlineCreate,
      setNewDeckData,
      resetForm,
      setGenerationState,
      setGenerationResults,
      setError,
      setValidationErrors,
      updateCardSelection,
      editCard,
      toggleBudgetWarningDismissed,
    },
    computed,
  };
}

export type UseGenerateAIModalReturn = ReturnType<typeof useGenerateAIModal>;
