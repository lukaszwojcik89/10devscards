import { useState, useCallback } from "react";
import type {
  GenerateFlashcardsRequestDTO,
  GenerateFlashcardsResponseDTO,
  ErrorResponseDTO,
  FlashcardPreview,
  GenerationSummary,
  GenerationProgress,
  GenerationError,
} from "../types";

/**
 * Hook do obsługi generacji fiszek przez API
 */
export function useFlashcardGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);

  /**
   * Waliduje request przed wysłaniem
   */
  const validateGenerationRequest = useCallback((request: GenerateFlashcardsRequestDTO) => {
    const errors: string[] = [];

    if (!request.deck_id?.trim()) {
      errors.push("Wybierz talię docelową");
    }

    if (!request.input_text?.trim()) {
      errors.push("Wprowadź tekst do analizy");
    } else if (request.input_text.length < 10) {
      errors.push("Tekst musi mieć co najmniej 10 znaków");
    } else if (request.input_text.length > 2000) {
      errors.push("Tekst może mieć maksymalnie 2000 znaków");
    }

    if (request.max_cards && (request.max_cards < 1 || request.max_cards > 20)) {
      errors.push("Liczba fiszek musi być między 1 a 20");
    }

    if (request.difficulty && !["beginner", "intermediate", "advanced"].includes(request.difficulty)) {
      errors.push("Nieprawidłowy poziom trudności");
    }

    if (request.language && !["pl", "en"].includes(request.language)) {
      errors.push("Nieobsługiwany język");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Szacuje czas generacji na podstawie długości tekstu
   */
  const estimateGenerationTime = useCallback((textLength: number): number => {
    // Base time: 2 seconds + 1 second per 100 characters
    const baseTime = 2000;
    const timePerChar = textLength * 10; // 10ms per character
    return Math.min(baseTime + timePerChar, 30000); // Max 30 seconds
  }, []);

  /**
   * Konwertuje odpowiedź API na format preview
   */
  const convertToPreviewFormat = useCallback(
    (
      apiResponse: GenerateFlashcardsResponseDTO
    ): { flashcards: FlashcardPreview[]; summary: GenerationSummary; deckSlug: string } => {
      const flashcards: FlashcardPreview[] = apiResponse.data.generated_flashcards.map((card, index) => ({
        id: `preview-${Date.now()}-${index}`,
        question: card.question,
        answer: card.answer,
        isSelected: true,
        isEdited: false,
      }));

      const summary: GenerationSummary = {
        totalGenerated: apiResponse.data.generation_summary.total_generated,
        totalCost: apiResponse.data.generation_summary.total_cost_usd,
        totalTokens: apiResponse.data.generation_summary.total_tokens,
        modelUsed: apiResponse.data.generation_summary.model_used,
        generationTime: 0, // Will be calculated during generation
      };

      return {
        flashcards,
        summary,
        deckSlug: apiResponse.data.deck_slug,
      };
    },
    []
  );

  /**
   * Obsługuje błędy z API
   */
  const handleApiError = useCallback((error: unknown): GenerationError => {
    if (error && typeof error === "object" && "error" in error) {
      const apiError = error as ErrorResponseDTO;

      let errorType: GenerationError["type"] = "unknown";
      let isRetryable = true;
      let retryAfter: number | undefined;

      switch (apiError.error.code) {
        case "VALIDATION_ERROR":
          errorType = "validation";
          isRetryable = false;
          break;
        case "BUDGET_EXCEEDED":
        case "MONTHLY_LIMIT_EXCEEDED":
          errorType = "budget";
          isRetryable = false;
          break;
        case "RATE_LIMITED":
          errorType = "rate_limit";
          retryAfter = 60; // 1 minute default
          break;
        case "API_ERROR":
        case "MODEL_ERROR":
          errorType = "api";
          break;
        case "NETWORK_ERROR":
          errorType = "network";
          break;
        default:
          errorType = "unknown";
      }

      return {
        type: errorType,
        code: apiError.error.code,
        message: apiError.error.message || "Wystąpił nieoczekiwany błąd",
        details: apiError.error.details,
        isRetryable,
        retryAfter,
      };
    }

    // Network or unknown error
    return {
      type: "network",
      code: "NETWORK_ERROR",
      message: "Błąd połączenia z serwerem. Sprawdź połączenie internetowe.",
      isRetryable: true,
    };
  }, []);

  /**
   * Główna funkcja generacji fiszek
   */
  const generateFlashcards = useCallback(
    async (
      request: GenerateFlashcardsRequestDTO,
      onProgressUpdate?: (progress: GenerationProgress) => void
    ): Promise<{ flashcards: FlashcardPreview[]; summary: GenerationSummary; deckSlug: string }> => {
      // Validate request
      const validation = validateGenerationRequest(request);
      if (!validation.isValid) {
        throw {
          type: "validation",
          code: "VALIDATION_ERROR",
          message: validation.errors.join(", "),
          isRetryable: false,
        } as GenerationError;
      }

      setIsGenerating(true);
      const startTime = Date.now();
      const estimatedTime = estimateGenerationTime(request.input_text.length);

      try {
        // Initialize progress
        const initialProgress: GenerationProgress = {
          current: 0,
          total: 100,
          status: "initializing",
          statusMessage: "Przygotowywanie generacji...",
          estimatedTimeRemaining: Math.floor(estimatedTime / 1000),
        };
        setProgress(initialProgress);
        onProgressUpdate?.(initialProgress);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (!prev) return null;

            const elapsed = Date.now() - startTime;
            const progressPercent = Math.min((elapsed / estimatedTime) * 80, 80); // Max 80% during processing
            const remaining = Math.max(0, Math.floor((estimatedTime - elapsed) / 1000));

            const updatedProgress: GenerationProgress = {
              ...prev,
              current: progressPercent,
              status: progressPercent < 30 ? "initializing" : progressPercent < 70 ? "processing" : "generating",
              statusMessage:
                progressPercent < 30
                  ? "Analizowanie tekstu..."
                  : progressPercent < 70
                    ? "Generowanie pytań..."
                    : "Finalizowanie fiszek...",
              estimatedTimeRemaining: remaining,
            };

            onProgressUpdate?.(updatedProgress);
            return updatedProgress;
          });
        }, 500);

        // Make API call
        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers,
          body: JSON.stringify(request),
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw errorData || new Error(`HTTP ${response.status}`);
        }

        const apiResponse: GenerateFlashcardsResponseDTO = await response.json();

        // Final progress update
        const finalProgress: GenerationProgress = {
          current: 100,
          total: 100,
          status: "finalizing",
          statusMessage: "Generacja zakończona!",
          estimatedTimeRemaining: 0,
        };
        setProgress(finalProgress);
        onProgressUpdate?.(finalProgress);

        // Convert to preview format
        const result = convertToPreviewFormat(apiResponse);
        result.summary.generationTime = Date.now() - startTime;

        return result;
      } catch (error) {
        const generationError = handleApiError(error);
        throw generationError;
      } finally {
        setIsGenerating(false);
        // Clear progress after a delay
        setTimeout(() => setProgress(null), 1000);
      }
    },
    [validateGenerationRequest, estimateGenerationTime, convertToPreviewFormat, handleApiError]
  );

  /**
   * Anuluje aktualną generację
   */
  const cancelGeneration = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    // In real implementation, would abort fetch request
  }, []);

  return {
    generateFlashcards,
    isGenerating,
    progress,
    cancelGeneration,
    estimateGenerationTime,
    validateGenerationRequest,
  };
}

export type UseFlashcardGenerationReturn = ReturnType<typeof useFlashcardGeneration>;
