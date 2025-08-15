import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertInline, BannerEmailUnverified } from "@/components/ui/alert";
import { useAuthToasts } from "@/components/ui/toast";
import type { LoginRequestDTO, LoginResponseDTO, ErrorResponseDTO } from "@/types";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LoginFormProps {
  onSuccess?: (response: LoginResponseDTO) => void;
  onError?: (error: ErrorResponseDTO) => void;
}

// =============================================================================
// FORM VALIDATION
// =============================================================================

function validateLoginForm(data: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};

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

  return errors;
}

// =============================================================================
// LOGIN FORM COMPONENT
// =============================================================================

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailUnverified, setShowEmailUnverified] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfirmedMessage, setShowConfirmedMessage] = useState(false);

  const authToasts = useAuthToasts();

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("registered") === "true") {
      setShowSuccessMessage(true);
      authToasts.registerSuccess();
    }
    if (urlParams.get("confirmed") === "true") {
      setShowConfirmedMessage(true);
    }
    if (urlParams.get("password_updated") === "true") {
      authToasts.passwordUpdated();
    }
  }, [authToasts]);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous errors
    setErrors({});
    setShowEmailUnverified(false);

    // Client-side validation
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request data
      const requestData: LoginRequestDTO = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      // API call
      const response = await fetch("/api/auth/login", {
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
        if (errorResponse.error.code === "EMAIL_NOT_CONFIRMED") {
          setShowEmailUnverified(true);
          setErrors({});
          authToasts.emailNotConfirmed();
        } else if (errorResponse.error.code === "VALIDATION_ERROR") {
          // Map validation errors to form fields
          const fieldErrors: LoginFormErrors = {};
          if (errorResponse.error.details) {
            Object.entries(errorResponse.error.details).forEach(([field, message]) => {
              if (field === "email" || field === "password") {
                fieldErrors[field] = String(message);
              }
            });
          }
          setErrors(
            fieldErrors.email || fieldErrors.password
              ? fieldErrors
              : {
                  general: errorResponse.error.message,
                }
          );
        } else {
          // Generic error handling
          setErrors({
            general: errorResponse.error.message || "Wystąpił błąd podczas logowania",
          });
          authToasts.loginError(errorResponse.error.message);
        }

        onError?.(errorResponse);
        return;
      }

      // Success handling
      const loginResponse: LoginResponseDTO = data;

      // Store tokens in localStorage
      localStorage.setItem("access_token", loginResponse.data.access_token);
      localStorage.setItem("refresh_token", loginResponse.data.refresh_token);

      authToasts.loginSuccess();
      onSuccess?.(loginResponse);

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch {
      authToasts.networkError();
      setErrors({
        general: "Wystąpił błąd podczas połączenia z serwerem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (_email: string) => {
    setIsResendingEmail(true);

    try {
      // TODO: Implement resend email endpoint
      // For now, just simulate the action
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message (you might want to use a toast instead)
      alert("Link potwierdzający został wysłany ponownie");
    } catch {
      alert("Wystąpił błąd podczas wysyłania emaila");
    } finally {
      setIsResendingEmail(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const hasErrors = Object.values(errors).some((error) => error);

  return (
    <div className="w-full space-y-6" suppressHydrationWarning>
      {/* Success Messages */}
      {showSuccessMessage && (
        <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm">
          Rejestracja zakończona sukcesem. Możesz się teraz zalogować.
        </div>
      )}

      {/* Success message */}
      {showConfirmedMessage && (
        <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm">
          Adres email został potwierdzony. Możesz się teraz zalogować.
        </div>
      )}

      {/* Email Unverified Banner */}
      <BannerEmailUnverified
        email={formData.email}
        show={showEmailUnverified}
        onResendEmail={handleResendEmail}
        isResending={isResendingEmail}
      />

      {/* Validation Errors */}
      <AlertInline
        message={errors.general}
        errors={
          errors.email || errors.password
            ? {
                ...(errors.email && { email: errors.email }),
                ...(errors.password && { password: errors.password }),
              }
            : undefined
        }
        show={hasErrors}
      />

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate suppressHydrationWarning>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="login-email"
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
            suppressHydrationWarning
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1">
            Hasło
          </label>
          <input
            type="password"
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.password ? "border-red-300 focus:ring-red-500" : ""
            }`}
            minLength={8}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            suppressHydrationWarning
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <div className="text-center text-sm mt-4">
          <a href="/reset-password" className="text-primary hover:underline">
            Zapomniałeś hasła?
          </a>
        </div>

        <div className="text-center text-sm mt-2">
          <span>Nie masz konta? </span>
          <a href="/register" className="text-primary hover:underline">
            Zarejestruj się
          </a>
        </div>
      </form>
    </div>
  );
}
