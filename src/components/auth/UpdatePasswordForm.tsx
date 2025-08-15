import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertInline, AlertInfo } from "@/components/ui/alert";
import type { ErrorResponseDTO } from "@/types";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
}

interface UpdatePasswordFormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface UpdatePasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: ErrorResponseDTO) => void;
}

// =============================================================================
// FORM VALIDATION
// =============================================================================

function validateUpdatePasswordForm(data: UpdatePasswordFormData): UpdatePasswordFormErrors {
  const errors: UpdatePasswordFormErrors = {};

  // Password validation
  if (!data.password.trim()) {
    errors.password = "Hasło jest wymagane";
  } else if (data.password.length < 8) {
    errors.password = "Hasło musi mieć minimum 8 znaków";
  } else if (data.password.length > 128) {
    errors.password = "Hasło nie może być dłuższe niż 128 znaków";
  }

  // Confirm password validation
  if (!data.confirmPassword.trim()) {
    errors.confirmPassword = "Potwierdzenie hasła jest wymagane";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Hasła nie są identyczne";
  }

  return errors;
}

// =============================================================================
// UPDATE PASSWORD FORM COMPONENT
// =============================================================================

export function UpdatePasswordForm({ onSuccess, onError }: UpdatePasswordFormProps) {
  const [formData, setFormData] = useState<UpdatePasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<UpdatePasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Extract reset token from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (!token) {
      setErrors({
        general: "Nieprawidłowy lub brakujący token resetowania hasła",
      });
    } else {
      setResetToken(token);
    }
  }, []);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof UpdatePasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we have a valid token
    if (!resetToken) {
      setErrors({
        general: "Nieprawidłowy token resetowania hasła",
      });
      return;
    }

    // Reset previous errors and success message
    setErrors({});
    setShowSuccessMessage(false);

    // Client-side validation
    const validationErrors = validateUpdatePasswordForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request data
      const requestData = {
        token: resetToken,
        password: formData.password,
      };

      // API call
      const response = await fetch("/api/auth/password/update", {
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
          const fieldErrors: UpdatePasswordFormErrors = {};
          if (errorResponse.error.details) {
            Object.entries(errorResponse.error.details).forEach(([field, message]) => {
              if (field === "password") {
                fieldErrors[field] = String(message);
              }
            });
          }
          setErrors(fieldErrors.password ? fieldErrors : {
            general: errorResponse.error.message,
          });
        } else if (errorResponse.error.code === "INVALID_TOKEN") {
          setErrors({
            general: "Token resetowania hasła jest nieprawidłowy lub wygasł. Spróbuj ponownie zresetować hasło.",
          });
        } else {
          // Generic error handling
          setErrors({
            general: errorResponse.error.message || "Wystąpił błąd podczas aktualizacji hasła",
          });
        }

        onError?.(errorResponse);
        return;
      }

      // Success handling
      setShowSuccessMessage(true);
      onSuccess?.();

      // Redirect to login after success
      setTimeout(() => {
        window.location.href = "/login?password_updated=true";
      }, 3000);

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
        <AlertInfo
          variant="success"
          message="Hasło zostało pomyślnie zaktualizowane!"
        >
          <p className="mt-2 text-sm">
            Twoje hasło zostało zmienione. Za chwilę zostaniesz przekierowany do strony logowania.
          </p>
        </AlertInfo>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Validation Errors */}
      <AlertInline
        message={errors.general}
        errors={
          errors.password || errors.confirmPassword
            ? {
                ...(errors.password && { password: errors.password }),
                ...(errors.confirmPassword && { "potwierdzenie hasła": errors.confirmPassword }),
              }
            : undefined
        }
        show={hasErrors}
      />

      {/* Update Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium mb-1">
            Nowe hasło
          </label>
          <input
            type="password"
            id="new-password"
            name="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.password ? "border-red-300 focus:ring-red-500" : ""
            }`}
            minLength={8}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
          />
          <p id="password-hint" className="text-xs text-muted-foreground mt-1">
            Minimum 8 znaków
          </p>
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
            Potwierdź nowe hasło
          </label>
          <input
            type="password"
            id="confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.confirmPassword ? "border-red-300 focus:ring-red-500" : ""
            }`}
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !resetToken}>
          {isSubmitting ? "Aktualizowanie..." : "Ustaw nowe hasło"}
        </Button>

        <div className="text-center text-sm mt-4">
          <a href="/login" className="text-primary hover:underline">
            Wróć do logowania
          </a>
        </div>
      </form>
    </div>
  );
}
