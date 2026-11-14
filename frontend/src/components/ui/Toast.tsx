import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastVariant = "success" | "info" | "error";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  dismissLabel: string;
  onDismiss: () => void;
}

export function Toast({
  message,
  variant = "success",
  dismissLabel,
  onDismiss,
}: ToastProps) {
  const borderClass =
    variant === "error" ? "border-status-break/40" : "border-border-subtle";

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border ${borderClass} bg-surface-elevated px-4 py-3 text-sm text-content shadow-elevated`}
    >
      {variant === "error" ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-status-break" aria-hidden="true" />
      ) : variant === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-status-valid" aria-hidden="true" />
      ) : (
        <Info className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      )}
      <span className="flex-1 font-medium">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
