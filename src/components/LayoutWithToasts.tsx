import { ToastProvider } from "@/components/ui/toast";

interface LayoutWithToastsProps {
  children: React.ReactNode;
}

export function LayoutWithToasts({ children }: LayoutWithToastsProps) {
  return <ToastProvider>{children}</ToastProvider>;
}
