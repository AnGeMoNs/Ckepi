import type { ReactNode } from "react";

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function Switch({
  id,
  checked,
  onChange,
  label,
  description,
  icon,
  trailing,
  className = "",
}: SwitchProps) {
  return (
    <div
      className={`flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-content ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0">
          <label htmlFor={id} className="cursor-pointer font-medium text-content">
            {label}
          </label>
          {description && <p className="text-xs text-content-muted">{description}</p>}
        </div>
        {trailing}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          checked
            ? "border-accent bg-accent"
            : "border-border-subtle bg-surface-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-surface-elevated shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
