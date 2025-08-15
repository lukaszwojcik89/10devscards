import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertInline, AlertInfo } from "@/components/ui/alert";
import type { RegisterRequestDTO, RegisterResponseDTO, ErrorResponseDTO } from "@/types";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RegisterFormData {
  email: string;
  password: string;
  age_confirmation: boolean;
}

interface RegisterFormErrors {
  email?: string;
  password?: string;
  age_confirmation?: string;
  general?: string;
}

interface RegisterFormProps {
  onSuccess?: (response: RegisterResponseDTO) => void;
  onError?: (error: ErrorResponseDTO) => void;
}

// =============================================================================
// FORM VALIDATION
// =============================================================================

function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  // Email validation
  if (!data.email.trim()) {
    errors.email = "Email jest wymagany";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Nieprawidłowy format email";
  } else if (data.email.length > 254) {
    errors.email = "Email nie może być dłuższy niż 254 znaków";
  }

  // Password validation
  if (!data.password.trim()) {
    errors.password = "Hasło jest wymagane";
  } else if (data.password.length < 8) {
    errors.password = "Hasło musi mieć minimum 8 znaków";
  } else if (data.password.length > 128) {
    errors.password = "Hasło nie może być dłuższe niż 128 znaków";
  }

  // Age confirmation validation (required by GDPR)
  if (!data.age_confirmation) {
    errors.age_confirmation = "Potwierdzenie wieku jest wymagane";
  }

  return errors;
}

// =============================================================================
// REGISTER FORM COMPONENT
// =============================================================================

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    age_confirmation: false,
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "age_confirmation" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing/checking
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors and success message
    setErrors({});
    setShowSuccessMessage(false);

    // Client-side validation
    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request data
      const requestData: RegisterRequestDTO = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        age_confirmation: formData.age_confirmation,
      };

      // API call
      const response = await fetch("/api/auth/register", {
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
          const fieldErrors: RegisterFormErrors = {};
          if (errorResponse.error.details) {
            Object.entries(errorResponse.error.details).forEach(([field, message]) => {
              if (field === "email" || field === "password" || field === "age_confirmation") {
                fieldErrors[field as keyof RegisterFormErrors] = String(message);
              }
            });
          }
          setErrors(fieldErrors.email || fieldErrors.password || fieldErrors.age_confirmation ? fieldErrors : {
            general: errorResponse.error.message,
          });
        } else if (errorResponse.error.code === "EMAIL_EXISTS") {
          setErrors({
            email: "Użytkownik z tym adresem email już istnieje",
          });
        } else {
          // Generic error handling
          setErrors({
            general: errorResponse.error.message || "Wystąpił błąd podczas rejestracji",
          });
        }

        onError?.(errorResponse);
        return;
      }

      // Success handling
      const registerResponse: RegisterResponseDTO = data;
      setShowSuccessMessage(true);
      
      // Clear form
      setFormData({
        email: "",
        password: "",
        age_confirmation: false,
      });

      onSuccess?.(registerResponse);

      // Redirect to login with success flag after a short delay
      setTimeout(() => {
        window.location.href = "/login?registered=true";
      }, 2000);

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
          message="Konto zostało utworzone pomyślnie!"
        >
          <p className="mt-2 text-sm">
            Wysłaliśmy link potwierdzający na adres <strong>{formData.email}</strong>.
            Sprawdź swoją skrzynkę pocztową i kliknij link, aby aktywować konto.
          </p>
          <p className="mt-2 text-sm">
            Za chwilę zostaniesz przekierowany do strony logowania...
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
          errors.email || errors.password || errors.age_confirmation
            ? {
                ...(errors.email && { email: errors.email }),
                ...(errors.password && { password: errors.password }),
                ...(errors.age_confirmation && { "potwierdzenie wieku": errors.age_confirmation }),
              }
            : undefined
        }
        show={hasErrors}
      />

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="register-email"
            name="email"
            value={formData.email}
            onChange={handleInputChange("email")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.email ? "border-red-300 focus:ring-red-500" : ""
            }`}
            placeholder="email@example.com"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium mb-1">
            Hasło
          </label>
          <input
            type="password"
            id="register-password"
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

        {/* Age Confirmation Checkbox - Required by GDPR (US-003) */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="age_confirmation"
              name="age_confirmation"
              checked={formData.age_confirmation}
              onChange={handleInputChange("age_confirmation")}
              className={`mt-1 h-4 w-4 rounded border focus:ring-2 focus:ring-primary ${
                errors.age_confirmation ? "border-red-300 focus:ring-red-500" : ""
              }`}
              required
              aria-invalid={!!errors.age_confirmation}
              aria-describedby={errors.age_confirmation ? "age-error" : "age-description"}
            />
            <label htmlFor="age_confirmation" className="text-sm leading-5">
              <span id="age-description">
                Potwierdzam, że mam ukończone <strong>16 lat</strong> i akceptuję{" "}
                <a href="/terms" className="text-primary hover:underline">
                  regulamin
                </a>{" "}
                i{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  politykę prywatności
                </a>
                .
              </span>
            </label>
          </div>
          {errors.age_confirmation && (
            <p id="age-error" className="text-xs text-red-600" role="alert">
              {errors.age_confirmation}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>

        <div className="text-center text-sm mt-4">
          <span>Masz już konto? </span>
          <a href="/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </form>
    </div>
  );
}
