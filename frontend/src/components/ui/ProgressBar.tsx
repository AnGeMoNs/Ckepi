interface ProgressBarProps {
  value: number; // 0 to 1
  tone?: "accent" | "valid" | "warn" | "break";
  label?: string;
}

const TONE_FILL: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  accent: "fill-accent",
  valid: "fill-status-valid",
  warn: "fill-status-warn",
  break: "fill-status-break",
};

export function ProgressBar({ value, tone = "accent", label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const widthPct = Math.round(clamped * 100);

  return (
    <svg
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      role="progressbar"
      aria-label={label}
      aria-valuenow={widthPct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-border-subtle"
    >
      <rect x="0" y="0" width={widthPct} height="6" rx="3" className={TONE_FILL[tone]} />
    </svg>
  );
}

