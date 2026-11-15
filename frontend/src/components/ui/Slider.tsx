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
    <div className="flex flex-col gap-2">
      <div className="flex min-h-[2.75rem] items-start justify-between gap-2 text-sm font-semibold leading-snug text-content">
        <div className="flex min-w-0 items-start gap-1">
          <label htmlFor={id} className="font-semibold text-content">
            {label}
          </label>
          {tooltip}
        </div>
        <span className="shrink-0 rounded-full border border-border-subtle/60 bg-surface/40 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-content">
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
        className="ckepi-range min-h-11 w-full cursor-pointer"
      />
      {helpText && <p className="text-xs leading-relaxed text-content-muted">{helpText}</p>}
    </div>
  );
}
