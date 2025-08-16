import React, { createContext, useContext, type ReactNode } from "react";
import { useGenerateAIModal, type UseGenerateAIModalReturn } from "../../hooks/useGenerateAIModal";

interface GenerateAIContextValue {
  modal: UseGenerateAIModalReturn;
}

const GenerateAIContext = createContext<GenerateAIContextValue | null>(null);

interface GenerateAIProviderProps {
  children: ReactNode;
}

/**
 * Provider dla context Generator AI Modal
 * Umożliwia dostęp do stanu modal z różnych komponentów
 */
export function GenerateAIProvider({ children }: GenerateAIProviderProps) {
  const modal = useGenerateAIModal();

  const value: GenerateAIContextValue = {
    modal,
  };

  return <GenerateAIContext.Provider value={value}>{children}</GenerateAIContext.Provider>;
}

/**
 * Hook do korzystania z context Generator AI
 */
export function useGenerateAIContext() {
  const context = useContext(GenerateAIContext);
  if (!context) {
    throw new Error("useGenerateAIContext must be used within GenerateAIProvider");
  }
  return context;
}
