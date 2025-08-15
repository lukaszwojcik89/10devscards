import { useCallback } from "react";

/**
 * Custom hook z navigation helpers dla dashboard quick actions
 */
export const useQuickActions = () => {
  const navigateToStudy = useCallback(() => {
    // Navigate to study session with today's cards
    if (typeof window !== "undefined") {
      window.location.assign("/study?mode=today");
    }
  }, []);

  const navigateToStudyWithCatchup = useCallback(() => {
    // Navigate to study session with catchup mode
    if (typeof window !== "undefined") {
      window.location.assign("/study?mode=catchup");
    }
  }, []);

  const navigateToGenerate = useCallback(() => {
    // Navigate to AI generation page
    if (typeof window !== "undefined") {
      window.location.assign("/generate-ai");
    }
  }, []);

  const navigateToCreateDeck = useCallback(() => {
    // Navigate to deck creation page
    if (typeof window !== "undefined") {
      window.location.assign("/decks/create");
    }
  }, []);

  const navigateToDecks = useCallback(() => {
    // Navigate to decks list page
    if (typeof window !== "undefined") {
      window.location.assign("/decks");
    }
  }, []);

  const navigateToDeckDetail = useCallback((slug: string) => {
    // Navigate to specific deck detail page
    if (typeof window !== "undefined") {
      window.location.assign(`/decks/${slug}`);
    }
  }, []);

  const navigateToSettings = useCallback(() => {
    // Navigate to settings page
    if (typeof window !== "undefined") {
      window.location.assign("/settings");
    }
  }, []);

  const navigateToHelp = useCallback(() => {
    // Navigate to help page
    if (typeof window !== "undefined") {
      window.location.assign("/help");
    }
  }, []);

  const handleActionClick = useCallback(
    (action: string) => {
      switch (action) {
        case "new-session":
          navigateToStudy();
          break;
        case "generate-ai":
          navigateToGenerate();
          break;
        case "create-deck":
          navigateToCreateDeck();
          break;
        default:
          // Unknown action - silently ignore
          break;
      }
    },
    [navigateToStudy, navigateToGenerate, navigateToCreateDeck]
  );

  const handleKpiClick = useCallback(
    (type: string) => {
      switch (type) {
        case "study-today":
          navigateToStudy();
          break;
        case "catchup":
          navigateToStudyWithCatchup();
          break;
        case "streak":
          // Could open streak details modal or navigate to stats
          navigateToSettings();
          break;
        default:
          // Unknown KPI type - silently ignore
          break;
      }
    },
    [navigateToStudy, navigateToStudyWithCatchup, navigateToSettings]
  );

  return {
    navigateToStudy,
    navigateToStudyWithCatchup,
    navigateToGenerate,
    navigateToCreateDeck,
    navigateToDecks,
    navigateToDeckDetail,
    navigateToSettings,
    navigateToHelp,
    handleActionClick,
    handleKpiClick,
  };
};
