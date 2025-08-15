import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

// =============================================================================
// ALERT TYPES & INTERFACES
// =============================================================================

export type AlertVariant = "default" | "destructive" | "success" | "warning";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  children: React.ReactNode;
}

export interface AlertInlineProps extends Omit<AlertProps, "variant" | "children"> {
  message?: string;
  errors?: Record<string, string>;
  show?: boolean;
  children?: React.ReactNode;
}

export interface AlertInfoProps extends Omit<AlertProps, "variant"> {
  message: string;
  show?: boolean;
  variant?: "success" | "info" | "warning";
}

// =============================================================================
// BASE ALERT COMPONENT
// =============================================================================

const alertVariants = {
  default: "bg-background text-foreground border",
  destructive: "bg-red-50 text-red-800 border-red-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
};

const iconVariants = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
};

export function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  const Icon = iconVariants[variant];
  
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm flex items-start gap-3",
        alertVariants[variant],
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

// =============================================================================
// ALERT INLINE - For form validation errors
// =============================================================================

export function AlertInline({ message, errors, show = true, className, ...props }: AlertInlineProps) {
  if (!show || (!message && !errors)) return null;

  const hasErrors = errors && Object.keys(errors).length > 0;
  const displayMessage = message || "Sprawdź błędy poniżej";

  return (
    <Alert variant="destructive" className={cn("mb-4", className)} {...props}>
      <div>
        <p className="font-medium">{displayMessage}</p>
        {hasErrors && (
          <ul className="mt-2 space-y-1 text-xs">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="flex items-start gap-2">
                <span className="font-medium capitalize">{field}:</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}

// =============================================================================
// ALERT INFO - For success/info messages
// =============================================================================

export function AlertInfo({ message, show = true, variant = "info", className, children, ...props }: AlertInfoProps) {
  if (!show) return null;

  const alertVariant = variant === "info" ? "default" : variant;

  return (
    <Alert variant={alertVariant} className={cn("mb-4", className)} {...props}>
      <div>
        <p>{message}</p>
        {children}
      </div>
    </Alert>
  );
}

// =============================================================================
// BANNER EMAIL UNVERIFIED - Special banner for unverified email
// =============================================================================

export interface BannerEmailUnverifiedProps {
  email?: string;
  show?: boolean;
  onResendEmail?: (email: string) => void;
  isResending?: boolean;
}

export function BannerEmailUnverified({
  email,
  show = true,
  onResendEmail,
  isResending = false,
}: BannerEmailUnverifiedProps) {
  if (!show) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <div>
        <p className="font-medium">Email nie został potwierdzony</p>
        <p className="mt-1 text-sm">
          Sprawdź swoją skrzynkę pocztową i kliknij link potwierdzający.
          {email && ` Link został wysłany na adres: ${email}`}
        </p>
        {email && onResendEmail && (
          <button
            type="button"
            onClick={() => onResendEmail(email)}
            disabled={isResending}
            className="mt-2 text-sm underline hover:no-underline disabled:opacity-50"
          >
            {isResending ? "Wysyłanie..." : "Wyślij ponownie link potwierdzający"}
          </button>
        )}
      </div>
    </Alert>
  );
}
