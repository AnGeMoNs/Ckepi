import { useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Download,
  Recycle,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type {
  AnalogMatchItem,
  PlanetarySite,
  SiteComparisonResponse,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface FieldTrialPlannerProps {
  activeSite?: PlanetarySite;
  selectedCell?: AnalogMatchItem | null;
  comparison?: SiteComparisonResponse | null;
  onGoToCompare: () => void;
  onGoToEvidence: () => void;
}

const REUSABLE_EQUIPMENT_IDS = [
  "imu_inclinometer",
  "rover_wheels_chassis",
  "lifepo4_battery",
  "portable_weather_station",
  "open_microcontroller",
] as const;

export function FieldTrialPlanner({
  activeSite,
  selectedCell,
  comparison,
  onGoToCompare,
  onGoToEvidence,
}: FieldTrialPlannerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [trialTitle, setTrialTitle] = useState<string>(t("plan.defaults.title"));
  const [trialObjective, setTrialObjective] = useState<string>(t("plan.defaults.objective"));
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "imu_inclinometer",
    "open_microcontroller",
  ]);
  const [localNotes, setLocalNotes] = useState<string>("");

  const applyPreset = (presetId: "rover" | "thermal" | "steam") => {
    setTrialTitle(t(`plan.presets.${presetId}.title`));
    setTrialObjective(t(`plan.presets.${presetId}.objective`));
    if (presetId === "rover") {
      setSelectedEquipment(["imu_inclinometer", "rover_wheels_chassis", "lifepo4_battery", "open_microcontroller"]);
    } else if (presetId === "thermal") {
      setSelectedEquipment(["portable_weather_station", "lifepo4_battery", "open_microcontroller"]);
    } else {
      setSelectedEquipment(["imu_inclinometer", "open_microcontroller"]);
    }
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportPlan = () => {
    const siteName = activeSite ? t(activeSite.name_key) : "N/A";
    const cellName = selectedCell ? `${t(selectedCell.region_key)} (${selectedCell.earth_cell_h3})` : "N/A";
    const equipLabels = selectedEquipment.map((id) => `- [x] ${t(`plan.equipment.${id}`)}`).join("\n");
    const md = [
      `# ${trialTitle}`,
      "",
      `- **${t("plan.fields.planetarySite")}:** ${siteName}`,
      `- **${t("plan.fields.earthCell")}:** ${cellName}`,
      selectedCell
        ? `- **S_ind / S_dep / R_break:** ${formatPercent(selectedCell.s_ind, lang)} / ${formatPercent(
            selectedCell.s_dep,
            lang
          )} / ${formatPercent(selectedCell.r_break_overall, lang)}`
        : "",
      "",
      `## ${t("plan.fields.objective")}`,
      trialObjective,
      "",
      `## ${t("plan.circularTitle")}`,
      equipLabels || `- ${t("plan.noEquipmentSelected")}`,
      "",
      `## ${t("plan.limitsTitle")}`,
      `- ${t("plan.limitsNote")}`,
      `- ${t("plan.costsPending")}`,
      localNotes ? `\n## ${t("plan.fields.notes")}\n${localNotes}` : "",
      "",
      `> ${t("plan.disclaimer")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ckepi-trial-plan-${activeSite?.site_id ?? "site"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" aria-hidden="true" />
              <CardTitle>{t("plan.title")}</CardTitle>
              <Badge variant="accent">ODS 9 · ODS 12 · ODS 17</Badge>
            </div>
            <p className="text-xs text-content-muted sm:text-sm">{t("plan.subtitle")}</p>
          </div>
          <Button variant="primary" onClick={handleExportPlan}>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t("plan.exportBtn")}</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Site & Cell Context */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border-subtle bg-surface p-3 text-xs">
              <p className="font-semibold text-content">
                <span aria-label={t("nav.locationLabel")}>📍</span> {t("plan.fields.planetarySite")}
              </p>
              {activeSite ? (
                <p className="mt-1 text-content-muted">
                  {t(activeSite.name_key)} ({formatNumber(activeSite.coordinates.lat, lang, 2)}°,{" "}
                  {formatNumber(activeSite.coordinates.lon, lang, 2)}°) ·{" "}
                  {t("variables.slope_deg")}:{" "}
                  {formatNumber(activeSite.variables.independent.slope_deg ?? 0, lang, 1)}°
                </p>
              ) : (
                <p className="mt-1 text-content-muted">{t("plan.noSiteSelected")}</p>
              )}
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface p-3 text-xs">
              <p className="font-semibold text-content">
                <span aria-label={t("nav.locationLabel")}>📍</span> {t("plan.fields.earthCell")}
              </p>
              {selectedCell ? (
                <p className="mt-1 text-content-muted">
                  {t(selectedCell.region_key)} · {selectedCell.earth_cell_h3} (
                  {formatNumber(selectedCell.coordinates.lat, lang, 2)}°,{" "}
                  {formatNumber(selectedCell.coordinates.lon, lang, 2)}°) · S_ind{" "}
                  {formatPercent(selectedCell.s_ind, lang)}
                </p>
              ) : (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-content-muted">{t("plan.noCellSelected")}</span>
                  <Button variant="secondary" onClick={onGoToCompare}>
                    {t("nav.backToCompare")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Trial Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-content-muted">{t("plan.presetsLabel")}:</span>
            {(["rover", "thermal", "steam"] as const).map((presetId) => (
              <Button key={presetId} variant="secondary" onClick={() => applyPreset(presetId)}>
                {t(`plan.presets.${presetId}.label`)}
              </Button>
            ))}
          </div>

          {/* Trial Form (In-memory only, no personal data stored) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
              <span>{t("plan.fields.trialTitle")}</span>
              <input
                type="text"
                value={trialTitle}
                onChange={(e) => setTrialTitle(e.target.value)}
                className="min-h-11 rounded-lg border border-border-subtle bg-surface px-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
              <span>{t("plan.fields.costs")}</span>
              <input
                type="text"
                readOnly
                value={t("plan.costsPending")}
                className="min-h-11 rounded-lg border border-border-subtle bg-surface-muted px-3 text-sm text-content-muted"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted md:col-span-2">
              <span>{t("plan.fields.objective")}</span>
              <textarea
                rows={2}
                value={trialObjective}
                onChange={(e) => setTrialObjective(e.target.value)}
                className="rounded-lg border border-border-subtle bg-surface p-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
          </div>

          {/* Circular Economy / Reusable Equipment Checklist (ODS 12) */}
          <div className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Recycle className="h-4 w-4 text-status-valid" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-content">{t("plan.circularTitle")}</h3>
              </div>
              <Badge variant="valid">ODS 12.5</Badge>
            </div>
            <p className="text-xs text-content-muted">{t("plan.circularNote")}</p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {REUSABLE_EQUIPMENT_IDS.map((id) => {
                const checked = selectedEquipment.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      checked
                        ? "border-accent bg-accent/10 font-semibold text-content"
                        : "border-border-subtle bg-surface-elevated text-content-muted hover:bg-surface-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEquipment(id)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span>{t(`plan.equipment.${id}`)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Irreproducible Limits & Risks */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-status-break/30 bg-status-break/5 p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-content">
                <ShieldAlert className="h-4 w-4 text-status-break" aria-hidden="true" />
                <span>{t("plan.limitsTitle")}</span>
              </div>
              <p className="text-content-muted">{t("plan.limitsNote")}</p>
              {comparison && (
                <p className="font-medium text-content">
                  R_break: {formatPercent(comparison.match.r_break_overall, lang)}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border-subtle bg-surface p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-content">
                <Users className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("plan.collaborationTitle")}</span>
              </div>
              <p className="text-content-muted">{t("plan.collaborationNote")}</p>
              <Button variant="secondary" onClick={onGoToEvidence}>
                {t("nav.viewEvidence")}
              </Button>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
            <span>{t("plan.fields.notes")}</span>
            <textarea
              rows={2}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder={t("plan.notesPlaceholder")}
              className="rounded-lg border border-border-subtle bg-surface p-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>

          <div className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-muted/50 p-3 text-xs text-content-muted">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warn" aria-hidden="true" />
            <span>{t("plan.disclaimer")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
