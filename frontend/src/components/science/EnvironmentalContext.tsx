import { useTranslation } from "react-i18next";
import { ParamIcon, type ParamIconName } from "../ui/ParamIcon";
import type { MeasuredCell } from "./measuredCells";

interface Props { cell: MeasuredCell; format: (value: number, digits?: number) => string }
const ITEMS: { icon: ParamIconName; variable: string; unit: string }[] = [
  { icon: "water", variable: "relative_humidity_pct", unit: "%" },
  { icon: "solar", variable: "solar_flux_wm2", unit: "W/m²" },
  { icon: "wind", variable: "surface_wind_ms", unit: "m/s" },
  { icon: "soil", variable: "thermal_inertia", unit: "J·m⁻²·K⁻¹·s⁻½" },
  { icon: "vegetation", variable: "vegetation_lai_proxy", unit: "m²/m²" },
];

/** Existing catalog context, explicitly distinct from direct DEM measurements. */
export function EnvironmentalContext({ cell, format }: Props) {
  const { t } = useTranslation();
  const variables = cell.comparison.match.earth_variables;
  return (
    <section className="dashboard-panel space-y-4 p-5 sm:p-6" aria-labelledby="environment-context-title">
      <div><h2 id="environment-context-title" className="text-xl font-bold">{t("dashboard.environmentTitle")}</h2><p className="mt-2 text-sm text-content-muted">{t("dashboard.environmentNote")}</p></div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {ITEMS.map(({ icon, variable, unit }) => {
          const value = variables.independent[variable] ?? variables.dependent[variable];
          return <div key={variable} className="min-w-0 rounded-2xl border border-border-subtle/50 bg-surface/40 p-3"><ParamIcon name={icon} className="mb-2 h-14 w-14" /><dt className="text-sm text-content-muted">{t(`variables.${variable}.label`)}</dt><dd className="mt-1 break-words font-mono text-base font-bold">{Number.isFinite(value) ? format(value, 1) : "—"}<span className="ml-1 text-xs font-normal">{unit}</span></dd></div>;
        })}
      </dl>
      <p className="break-words text-xs text-content-muted">{cell.comparison.match.provenance.source_apis.join(" · ")} · {cell.comparison.match.provenance.observation_window}</p>
    </section>
  );
}
