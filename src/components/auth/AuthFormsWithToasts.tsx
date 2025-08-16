import { ToastProvider } from "@/components/ui/toast";
import { lazy, Suspense } from "react";
import type { LoginResponseDTO, RegisterResponseDTO, ErrorResponseDTO } from "@/types";

// Lazy load form components for better performance
const LoginForm = lazy(() => import("./LoginForm").then((module) => ({ default: module.LoginForm })));
const RegisterForm = lazy(() => import("./RegisterForm").then((module) => ({ default: module.RegisterForm })));
const ResetPasswordForm = lazy(() =>
  import("./ResetPasswordForm").then((module) => ({ default: module.ResetPasswordForm }))
);
const UpdatePasswordForm = lazy(() =>
  import("./UpdatePasswordForm").then((module) => ({ default: module.UpdatePasswordForm }))
);

// Simple loading skeleton for forms
const FormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-10 bg-gray-200 rounded"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-10 bg-gray-200 rounded"></div>
    <div className="h-10 bg-gray-200 rounded w-full"></div>
  </div>
);

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
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm onSuccess={onSuccess} onError={onError} />
      </Suspense>
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
      <Suspense fallback={<FormSkeleton />}>
        <RegisterForm onSuccess={onSuccess} onError={onError} />
      </Suspense>
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
      <Suspense fallback={<FormSkeleton />}>
        <ResetPasswordForm onSuccess={onSuccess} onError={onError} />
      </Suspense>
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
      <Suspense fallback={<FormSkeleton />}>
        <UpdatePasswordForm onSuccess={onSuccess} onError={onError} />
      </Suspense>
    </ToastProvider>
  );
}
