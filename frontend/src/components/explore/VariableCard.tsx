import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type { VariableOrigin } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { InfoTooltip } from "../ui/InfoTooltip";
import { ParamIcon, type ParamIconName } from "../ui/ParamIcon";
import { widthClass } from "./ScoreGauge";

/** Cardboard illustration for each variable (same family as the rest of Explorar). */
const VARIABLE_ART: Record<string, ParamIconName> = {
  topographic_roughness: "relief",
  slope_deg: "slope",
  thermal_inertia: "soil",
  surface_albedo: "solar",
  solar_flux_wm2: "solar",
  subsurface_ice_frac: "water",
  aridity_index: "vegetation",
  relative_humidity_pct: "water",
  uv_irradiance_index: "radiation",
  vegetation_lai_proxy: "vegetation",
  diurnal_temp_amplitude_k: "temperature",
  nocturnal_cooling_k_hr: "temperature",
  mean_surface_temp_k: "temperature",
  surface_wind_ms: "wind",
  aeolian_dust_flux: "wind",
  ice_sublimation_rate: "water",
};

interface VariableCardProps {
  varKey: string;
  target?: number;
  origin?: VariableOrigin;
  weight: number;
  /** Editable (manual mode) shows sliders; otherwise a read-only weight gauge (preset profiles). */
  onWeightChange?: (value: number) => void;
  minSim?: number;
  onMinSimChange?: (value: number) => void;
}

/**
 * One variable, one card — the same format in manual mode and in every preset profile:
 * illustration, name, data origin, the destination's target value and its weight.
 */
export function VariableCard({ varKey, target, origin, weight, onWeightChange, minSim = 0, onMinSimChange }: VariableCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const editable = Boolean(onWeightChange);

  const slider = (id: string, label: string, value: number, max: number, onChange: (v: number) => void) => (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs text-content-muted">
        <label htmlFor={id}>{label}</label>
        <span className="font-mono text-sm font-semibold tabular-nums text-content">{formatPercent(value, lang)}</span>
      </div>
      <input id={id} type="range" min={0} max={max} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="ckepi-range min-h-11 w-full cursor-pointer" />
    </div>
  );

  return (
    <div className={`ckepi-liquid flex flex-col rounded-3xl p-4 ${weight > 0 ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-3">
        <ParamIcon name={VARIABLE_ART[varKey] ?? "relief"} className="h-11 w-11 drop-shadow-ckepi-logo" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <span className="text-sm font-bold leading-snug text-content">{t(`variables.${varKey}.label`)}</span>
            <InfoTooltip label={t(`variables.${varKey}.label`)} text={t(`variables.${varKey}.hint`)} />
          </div>
          {origin && (
            <Badge variant={origin === "measured" ? "valid" : origin === "model" ? "warn" : "default"}>
              {t(`confidence.origins.${origin}`)}
            </Badge>
          )}
        </div>
      </div>

      {typeof target === "number" && (
        <p className="mt-3 rounded-2xl border border-border-subtle/50 bg-surface/30 px-3 py-2 text-center">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-content-muted">{t("manualMode.targetValue")}</span>
          <span className="font-mono text-xl font-semibold tabular-nums text-content">{formatNumber(target, lang, 2)}</span>{" "}
          <span className="text-sm text-content-muted">{t(`variables.${varKey}.unit`)}</span>
        </p>
      )}

      {editable && onWeightChange ? (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {slider(`weight-${varKey}`, t("manualMode.weightLabel"), weight, 1, onWeightChange)}
          {onMinSimChange && slider(`minsim-${varKey}`, t("manualMode.minSimLabel"), minSim, 0.95, onMinSimChange)}
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2 text-xs text-content-muted">
            <span>{t("manualMode.weightLabel")}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-content">{formatPercent(weight, lang)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface/60 shadow-inner" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={weight} aria-label={t("manualMode.weightLabel")}>
            <div className={`h-full rounded-full bg-accent ${widthClass(weight)}`} />
          </div>
        </div>
      )}
    </div>
  );
}
