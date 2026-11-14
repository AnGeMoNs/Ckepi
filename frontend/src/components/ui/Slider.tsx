import type { ReactNode } from "react";

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formattedValue: string;
  onChange: (value: number) => void;
  helpText?: string;
  tooltip?: ReactNode;
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  formattedValue,
  onChange,
  helpText,
  tooltip,
}: SliderProps) {
  return (
    <div className="flex flex-col justify-between gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-content-muted">
        <div className="flex min-w-0 items-center gap-1">
          <label htmlFor={id} className="truncate font-medium text-content/90">
            {label}
          </label>
          {tooltip}
        </div>
        <span className="shrink-0 rounded-md border border-border-subtle/80 bg-surface-muted px-2 py-0.5 tabular-nums text-[11px] font-bold text-content">
          {formattedValue}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={formattedValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-h-9 sm:min-h-10 w-full cursor-pointer accent-accent"
      />
      {helpText && <p className="text-[11px] leading-relaxed text-content-muted">{helpText}</p>}
    </div>
  );
}
