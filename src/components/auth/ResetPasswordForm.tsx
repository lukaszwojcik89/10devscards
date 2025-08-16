import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertInline, AlertInfo } from "@/components/ui/alert";
import type { ErrorResponseDTO } from "@/types";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface ResetPasswordFormData {
  email: string;
}

interface ResetPasswordFormErrors {
  email?: string;
  general?: string;
}

interface ResetPasswordFormProps {
  onSuccess?: (email: string) => void;
  onError?: (error: ErrorResponseDTO) => void;
}

// =============================================================================
// FORM VALIDATION
// =============================================================================

function validateResetPasswordForm(data: ResetPasswordFormData): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  // Email validation
  if (!data.email.trim()) {
    errors.email = "Email jest wymagany";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Nieprawidłowy format email";
  } else if (data.email.length > 254) {
    errors.email = "Email nie może być dłuższy niż 254 znaków";
  }

  return errors;
}

// =============================================================================
// RESET PASSWORD FORM COMPONENT
// =============================================================================

export function ResetPasswordForm({ onSuccess, onError }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: "",
  });

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ email: value });

    // Clear email error when user starts typing
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous errors and success message
    setErrors({});
    setShowSuccessMessage(false);

    // Client-side validation
    const validationErrors = validateResetPasswordForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request data
      const requestData = {
        email: formData.email.trim().toLowerCase(),
      };

      // API call
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorResponse: ErrorResponseDTO = data;

        // Handle specific error types
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          // Map validation errors to form fields
          const fieldErrors: ResetPasswordFormErrors = {};
          if (errorResponse.error.details) {
            Object.entries(errorResponse.error.details).forEach(([field, message]) => {
              if (field === "email") {
                fieldErrors[field] = String(message);
              }
            });
          }
          setErrors(
            fieldErrors.email
              ? fieldErrors
              : {
                  general: errorResponse.error.message,
                }
          );
        } else if (errorResponse.error.code === "TOO_MANY_REQUESTS") {
          setErrors({
            general: "Zbyt wiele prób resetowania hasła. Spróbuj ponownie później.",
          });
        } else {
          // Generic error handling
          setErrors({
            general: errorResponse.error.message || "Wystąpił błąd podczas resetowania hasła",
          });
        }

        onError?.(errorResponse);
        return;
      }

      // Success handling
      setShowSuccessMessage(true);
      onSuccess?.(formData.email);
    } catch {
      setErrors({
        general: "Wystąpił błąd podczas połączenia z serwerem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const hasErrors = Object.values(errors).some((error) => error);

  if (showSuccessMessage) {
    return (
      <div className="w-full space-y-4">
        <AlertInfo variant="success" message="Instrukcje resetowania hasła zostały wysłane!">
          <p className="mt-2 text-sm">
            Jeśli konto z adresem <strong>{formData.email}</strong> istnieje, otrzymasz email z linkiem do resetowania
            hasła.
          </p>
          <p className="mt-2 text-sm">Sprawdź swoją skrzynkę pocztową (także folder spam).</p>
        </AlertInfo>

        <div className="text-center">
          <a href="/login" className="text-primary hover:underline">
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Validation Errors */}
      <AlertInline
        message={errors.general}
        errors={errors.email ? { email: errors.email } : undefined}
        show={hasErrors}
      />

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate suppressHydrationWarning>
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="reset-email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.email ? "border-red-300 focus:ring-red-500" : ""
            }`}
            placeholder="email@example.com"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : "email-description"}
            suppressHydrationWarning
          />
          <p id="email-description" className="text-xs text-muted-foreground mt-1">
            Podaj adres email powiązany z Twoim kontem
          </p>
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Wysyłanie..." : "Wyślij instrukcje"}
        </Button>

        <div className="text-center text-sm mt-4">
          <span>Pamiętasz hasło? </span>
          <a href="/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </form>
    </div>
  );
}
