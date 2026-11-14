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
        <div className="flex items-center gap-0.5">
          <label htmlFor={id}>{label}</label>
          {tooltip}
        </div>
        <span className="rounded bg-surface-muted px-1.5 py-0.5 tabular-nums font-semibold text-content">
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
        className="min-h-11 w-full cursor-pointer accent-accent"
      />
      {helpText && <p className="text-xs text-content-muted">{helpText}</p>}
    </div>
  );
}
