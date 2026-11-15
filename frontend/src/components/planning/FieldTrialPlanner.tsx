import type { Dispatch, SetStateAction } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Recycle,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import { useClipboard } from "../../hooks/useClipboard";
import type { FieldTrialDraft } from "../../utils/fieldTrialDraft";
import type {
  AnalogMatchItem,
  PlanetarySite,
  SiteComparisonResponse,
} from "../../types/analog";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface FieldTrialPlannerProps {
  draft: FieldTrialDraft;
  onDraftChange: Dispatch<SetStateAction<FieldTrialDraft>>;
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
  draft,
  onDraftChange,
  activeSite,
  selectedCell,
  comparison,
  onGoToCompare,
  onGoToEvidence,
}: FieldTrialPlannerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const trialTitle = draft.title ?? t("plan.defaults.title");
  const trialObjective = draft.objective ?? t("plan.defaults.objective");
  const selectedEquipment = draft.equipment;
  const localNotes = draft.notes;
  const clipboard = useClipboard();
  const copiedPlan = clipboard.status === "copied";

  const applyPreset = (presetId: "rover" | "thermal" | "steam") => {
    const equipment = presetId === "rover"
      ? ["imu_inclinometer", "rover_wheels_chassis", "lifepo4_battery", "open_microcontroller"]
      : presetId === "thermal"
        ? ["portable_weather_station", "lifepo4_battery", "open_microcontroller"]
        : ["imu_inclinometer", "open_microcontroller"];
    onDraftChange((prev) => ({
      ...prev,
      title: t(`plan.presets.${presetId}.title`),
      objective: t(`plan.presets.${presetId}.objective`),
      equipment,
    }));
  };

  const toggleEquipment = (id: string) => {
    onDraftChange((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(id)
        ? prev.equipment.filter((item) => item !== id)
        : [...prev.equipment, id],
    }));
  };

  const activeBreaks = comparison?.match.breakage_alerts.filter((b) => b.is_broken) ?? [];
  const recs = comparison?.match.engineering_recommendations;

  const buildMarkdownPlan = () => {
    const siteName = activeSite ? t(activeSite.name_key) : "N/A";
    const cellName = selectedCell ? `${t(selectedCell.region_key)} (${selectedCell.earth_cell_h3})` : "N/A";
    const equipLabels = selectedEquipment.map((id) => `- [x] ${t(`plan.equipment.${id}`)}`).join("\n");
    const breakLines = activeBreaks.map((b) => `- ${t(b.alert_key)}`).join("\n");
    const validLines = recs?.valid_tests.map((k) => `- ${t(k)}`).join("\n") ?? "";
    const invalidLines = recs?.invalid_tests.map((k) => `- ${t(k)}`).join("\n") ?? "";
    return [
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
      breakLines ? `\n### ${t("plan.breakageAlertsLabel")}\n${breakLines}` : "",
      validLines ? `\n### ${t("plan.validTestsShort")}\n${validLines}` : "",
      invalidLines ? `\n### ${t("plan.invalidTestsShort")}\n${invalidLines}` : "",
      `- ${t("plan.costsPending")}`,
      localNotes ? `\n## ${t("plan.fields.notes")}\n${localNotes}` : "",
      "",
      `> ${t("plan.disclaimer")}`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleCopyPlan = () => {
    void clipboard.copy(buildMarkdownPlan());
  };

  const handleExportPlan = () => {
    const md = buildMarkdownPlan();

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
            </div>
            <p className="text-xs text-content-muted sm:text-sm">{t("plan.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleCopyPlan} disabled={clipboard.status === "copying"}>
              {copiedPlan ? (
                <Check className="h-4 w-4 text-status-valid" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{copiedPlan ? t("plan.copiedBtn") : t("plan.copyBtn")}</span>
            </Button>
            <Button variant="primary" onClick={handleExportPlan}>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{t("plan.exportBtn")}</span>
            </Button>
            <span role="status" aria-live="polite" className="sr-only">
              {copiedPlan ? t("plan.copiedBtn") : ""}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-xs text-content-muted">{t("plan.draftSessionNote")}</p>
          {clipboard.status === "error" && (
            <p role="alert" className="text-sm text-status-break">{t("errors.clipboard_failed")}</p>
          )}
          {/* Site & Cell Context */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border-subtle bg-surface p-3 text-xs">
              <p className="font-semibold text-content">
                {t("plan.fields.planetarySite")}
              </p>
              {activeSite ? (
                <p className="mt-1 text-content-muted">
                  {t(activeSite.name_key)} ({formatNumber(activeSite.coordinates.lat, lang, 2)}°,{" "}
                  {formatNumber(activeSite.coordinates.lon, lang, 2)}°) ·{" "}
                  {t("variables.slope_deg.label")}:{" "}
                  {formatNumber(activeSite.variables.independent.slope_deg ?? 0, lang, 1)}°
                </p>
              ) : (
                <p className="mt-1 text-content-muted">{t("plan.noSiteSelected")}</p>
              )}
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface p-3 text-xs">
              <p className="font-semibold text-content">
                {t("plan.fields.earthCell")}
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
                onChange={(e) => onDraftChange((prev) => ({ ...prev, title: e.target.value }))}
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
                onChange={(e) => onDraftChange((prev) => ({ ...prev, objective: e.target.value }))}
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
                <div className="space-y-2 pt-1">
                  <p className="font-semibold text-content">
                    R_break: {formatPercent(comparison.match.r_break_overall, lang)}
                  </p>
                  {activeBreaks.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-medium text-status-break">
                        {t("plan.breakageAlertsLabel")}:
                      </p>
                      <ul className="list-disc space-y-0.5 pl-4 text-content-muted">
                        {activeBreaks.map((b) => (
                          <li key={b.variable}>{t(b.alert_key)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recs && recs.valid_tests.length > 0 && (
                    <p className="text-content-muted">
                      <span className="font-medium text-status-valid">
                        {t("plan.validTestsShort")}:
                      </span>{" "}
                      {recs.valid_tests.slice(0, 2).map((k) => t(k)).join(" · ")}
                    </p>
                  )}
                  {recs && recs.invalid_tests.length > 0 && (
                    <p className="text-content-muted">
                      <span className="font-medium text-status-break">
                        {t("plan.invalidTestsShort")}:
                      </span>{" "}
                      {recs.invalid_tests.slice(0, 2).map((k) => t(k)).join(" · ")}
                    </p>
                  )}
                </div>
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
              onChange={(e) => onDraftChange((prev) => ({ ...prev, notes: e.target.value }))}
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
