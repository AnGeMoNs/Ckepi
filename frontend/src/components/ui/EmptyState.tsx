import type { ReactNode } from "react";

import { Button } from "./Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle bg-surface-elevated px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-content-muted">
        {icon}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-semibold text-content">{title}</h3>
        <p className="text-sm text-content-muted">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
