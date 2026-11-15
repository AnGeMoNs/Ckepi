import { useTranslation } from "react-i18next";

import { formatPercent } from "../../i18n";

/** Gauge fill widths in 5 % steps (Tailwind classes, no inline styles). */
export const WIDTH_CLASS = [
  "w-0", "w-[5%]", "w-[10%]", "w-[15%]", "w-[20%]", "w-1/4", "w-[30%]", "w-[35%]", "w-[40%]", "w-[45%]", "w-1/2",
  "w-[55%]", "w-[60%]", "w-[65%]", "w-[70%]", "w-3/4", "w-[80%]", "w-[85%]", "w-[90%]", "w-[95%]", "w-full",
];

export const widthClass = (value: number) => WIDTH_CLASS[Math.round(Math.min(1, Math.max(0, value)) * 20)];

interface ScoreGaugeProps {
  label: string;
  value: number;
  /** "break" for the irreducible-gap index (higher = worse), "match" for similarities. */
  tone?: "match" | "break";
}

/** One metric as a small instrument: symbol, value in monospace and a filled groove. */
export function ScoreGauge({ label, value, tone = "match" }: ScoreGaugeProps) {
  const { i18n } = useTranslation();
  return (
    <div className="rounded-2xl border border-border-subtle/50 bg-surface/30 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-content-muted">{label}</span>
        <span className={`font-mono text-lg font-semibold tabular-nums ${tone === "break" ? "text-status-break" : "text-content"}`}>
          {formatPercent(value, i18n.language)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface/60 shadow-inner" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={1} aria-valuenow={value}>
        <div className={`h-full rounded-full ${tone === "break" ? "bg-status-break" : "bg-accent"} ${widthClass(value)}`} />
      </div>
    </div>
  );
}
