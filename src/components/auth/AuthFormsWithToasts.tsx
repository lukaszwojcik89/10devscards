import { ToastProvider } from "@/components/ui/toast";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import type { LoginResponseDTO, RegisterResponseDTO, ErrorResponseDTO } from "@/types";

// =============================================================================
// LOGIN FORM WITH TOASTS
// =============================================================================

interface LoginFormWithToastsProps {
  onSuccess?: (response: LoginResponseDTO) => void;
  onError?: (error: ErrorResponseDTO) => void;
}

export function LoginFormWithToasts({ onSuccess, onError }: LoginFormWithToastsProps) {
  return (
    <ToastProvider>
      <LoginForm onSuccess={onSuccess} onError={onError} />
    </ToastProvider>
  );
}

// =============================================================================
// REGISTER FORM WITH TOASTS
// =============================================================================

interface RegisterFormWithToastsProps {
  onSuccess?: (response: RegisterResponseDTO) => void;
  onError?: (error: ErrorResponseDTO) => void;
}

export function RegisterFormWithToasts({ onSuccess, onError }: RegisterFormWithToastsProps) {
  return (
    <ToastProvider>
      <RegisterForm onSuccess={onSuccess} onError={onError} />
    </ToastProvider>
  );
}

// =============================================================================
// RESET PASSWORD FORM WITH TOASTS
// =============================================================================

interface ResetPasswordFormWithToastsProps {
  onSuccess?: (email: string) => void;
  onError?: (error: ErrorResponseDTO) => void;
}

export function ResetPasswordFormWithToasts({ onSuccess, onError }: ResetPasswordFormWithToastsProps) {
  return (
    <ToastProvider>
      <ResetPasswordForm onSuccess={onSuccess} onError={onError} />
    </ToastProvider>
  );
}

// =============================================================================
// UPDATE PASSWORD FORM WITH TOASTS
// =============================================================================

interface UpdatePasswordFormWithToastsProps {
  onSuccess?: () => void;
  onError?: (error: ErrorResponseDTO) => void;
}

export function UpdatePasswordFormWithToasts({ onSuccess, onError }: UpdatePasswordFormWithToastsProps) {
  return (
    <ToastProvider>
      <UpdatePasswordForm onSuccess={onSuccess} onError={onError} />
    </ToastProvider>
  );
}
