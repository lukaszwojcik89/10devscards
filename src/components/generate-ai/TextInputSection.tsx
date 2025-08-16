import React from "react";
import type { TextInputProps } from "../../types";

interface TextInputSectionProps extends TextInputProps {
  label?: string;
  showCounter?: boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
  };
}

/**
 * Sekcja wprowadzania tekstu z walidacją i licznikiem znaków
 */
export function TextInputSection({
  inputText,
  onTextChange,
  maxLength = 2000,
  placeholder = "Wklej tutaj tekst, z którego AI ma wygenerować fiszki...",
  isDisabled = false,
  validationError,
  label = "Tekst do analizy",
  showCounter = true,
  validationRules = {},
}: TextInputSectionProps) {
  const { minLength = 10, maxLength: ruleMaxLength = maxLength, required = true } = validationRules;

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;

    // Prevent exceeding max length
    if (newText.length <= maxLength) {
      onTextChange(newText);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const currentText = inputText;
    const selectionStart = event.currentTarget.selectionStart;
    const selectionEnd = event.currentTarget.selectionEnd;

    // Calculate the text after paste
    const textAfterPaste = currentText.substring(0, selectionStart) + pastedText + currentText.substring(selectionEnd);

    // If pasted text would exceed limit, truncate it
    if (textAfterPaste.length > maxLength) {
      event.preventDefault();
      const allowedLength = maxLength - currentText.length + (selectionEnd - selectionStart);
      const truncatedPaste = pastedText.substring(0, allowedLength);
      const newText = currentText.substring(0, selectionStart) + truncatedPaste + currentText.substring(selectionEnd);
      onTextChange(newText);
    }
  };

  // Validation helpers
  const isTooShort = required && inputText.length > 0 && inputText.length < minLength;
  const isTooLong = inputText.length > ruleMaxLength;
  const hasValidationError = isTooShort || isTooLong || validationError;

  const getCounterColor = () => {
    if (inputText.length === 0) return "text-gray-500";
    if (inputText.length > maxLength * 0.9) return "text-red-600";
    if (inputText.length > maxLength * 0.7) return "text-orange-600";
    return "text-gray-600";
  };

  const getValidationMessage = () => {
    if (validationError) return validationError;
    if (isTooShort) return `Tekst musi mieć co najmniej ${minLength} znaków`;
    if (isTooLong) return `Tekst może mieć maksymalnie ${ruleMaxLength} znaków`;
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="text-input" className="block text-sm font-medium">
          {label}
        </label>
        {showCounter && (
          <span className={`text-sm ${getCounterColor()}`}>
            {inputText.length}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        id="text-input"
        value={inputText}
        onChange={handleTextChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={isDisabled}
        className={`w-full h-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none transition-colors ${
          hasValidationError
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        } ${isDisabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
        maxLength={maxLength}
        rows={8}
        spellCheck={false}
        autoComplete="off"
      />

      {getValidationMessage() && <p className="text-sm text-red-600">{getValidationMessage()}</p>}

      {inputText.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Słowa: ~{inputText.trim().split(/\s+/).length}</div>
          {inputText.length > maxLength * 0.8 && <div className="text-orange-600">Zbliżasz się do limitu znaków</div>}
        </div>
      )}
    </div>
  );
}
