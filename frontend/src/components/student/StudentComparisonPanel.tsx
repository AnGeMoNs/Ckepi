import {
  CheckCircle2,
  FlaskConical,
  MapPin,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type {
  AnalogMatchItem,
  MissionAiAnalysisResponse,
  PlanetarySite,
  SiteComparisonResponse,
} from "../../types/analog";
import { AiViabilityPanel } from "../mission/AiViabilityPanel";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

interface StudentComparisonPanelProps {
  comparison: SiteComparisonResponse;
  matches: AnalogMatchItem[];
  activeSite?: PlanetarySite;
  aiEnabled: boolean;
  aiAnalysis: MissionAiAnalysisResponse | null;
  onAiAnalysisChange: (next: MissionAiAnalysisResponse | null) => void;
  onSelectCell: (h3Index: string) => void;
  onOpenLearn: () => void;
  onSwitchToScientific: () => void;
}

export function StudentComparisonPanel({
  comparison,
  matches,
  aiEnabled,
  aiAnalysis,
  onAiAnalysisChange,
  onSelectCell,
  onOpenLearn,
  onSwitchToScientific,
}: StudentComparisonPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const match = comparison.match;
  const recs = match.engineering_recommendations;
  const earthName = match.known_analog_name ?? t(match.region_key);
  const planetName = t(comparison.site.name_key);
  const isMoon = comparison.site.body === "moon";

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const topMatches = useMemo(() => {
    return [...comparison.variable_deltas]
      .filter((d) => !d.is_breakage)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 4);
  }, [comparison.variable_deltas]);

  const quickDiscoveries = useMemo(() => {
    const picked: AnalogMatchItem[] = [];
    const seen = new Set<string>();
    const bestNew = matches.find((m) => !m.is_benchmark);
    const bestKnown = matches.find((m) => m.is_benchmark);
    for (const candidate of [bestNew, bestKnown, ...matches]) {
      if (!candidate || seen.has(candidate.earth_cell_h3)) continue;
      seen.add(candidate.earth_cell_h3);
      picked.push(candidate);
      if (picked.length >= 4) break;
    }
    return picked;
  }, [matches]);

  const gravityG = comparison.site.variables.breakage.gravity_g ?? (isMoon ? 0.166 : 0.38);
  const pressureMbar = comparison.site.variables.breakage.atm_pressure_mbar ?? (isMoon ? 0 : 6.1);
  const radiationMsv = comparison.site.variables.breakage.radiation_msv_yr ?? (isMoon ? 380 : 230);

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = t("studentPanel.speechSummary", {
      earthPlace: earthName,
      targetPlace: planetName,
      score: formatPercent(match.combined_score, lang),
      gravity: formatNumber(gravityG, lang, 2),
      radiation: formatNumber(radiationMsv, lang, 0),
    });
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.startsWith("pt") ? "pt-BR" : lang.startsWith("en") ? "en-US" : "es-CL";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const matchLevelBadge =
    recs.viability_tier === "high"
      ? { variant: "valid" as const, label: t("studentPanel.matchHigh") }
      : recs.viability_tier === "moderate"
      ? { variant: "warn" as const, label: t("studentPanel.matchModerate") }
      : { variant: "default" as const, label: t("studentPanel.matchPartial") };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isMoon ? "moon" : "mars"}>{t(`bodies.${comparison.site.body}`)}</Badge>
            <Badge variant={matchLevelBadge.variant}>{matchLevelBadge.label}</Badge>
          </div>
          <CardTitle className="text-base sm:text-lg">
            {t("studentPanel.title", { earthPlace: earthName, targetPlace: planetName })}
          </CardTitle>
          <p className="text-xs text-content-muted sm:text-sm">
            {t(match.biome_key)} · {match.country_code} ·{" "}
            {formatNumber(match.coordinates.lat, lang, 2)}°,{" "}
            {formatNumber(match.coordinates.lon, lang, 2)}°
          </p>
        </div>

        <Button variant="secondary" onClick={toggleSpeech}>
          {isSpeaking ? (
            <VolumeX className="h-4 w-4 text-status-break" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-accent" aria-hidden="true" />
          )}
          <span>
            {isSpeaking ? t("studentPanel.stopVoice") : t("studentPanel.listenVoice")}
          </span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Friendly Score Bars */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border-subtle bg-surface p-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-content">{t("studentPanel.terrainLabel")}</span>
              <span className="font-bold tabular-nums text-accent">
                {formatPercent(match.s_ind, lang)}
              </span>
            </div>
            <ProgressBar
              value={match.s_ind}
              tone={match.s_ind >= 0.7 ? "valid" : "accent"}
              label={t("studentPanel.terrainLabel")}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-content">{t("studentPanel.climateLabel")}</span>
              <span className="font-bold tabular-nums text-accent">
                {formatPercent(match.s_dep, lang)}
              </span>
            </div>
            <ProgressBar
              value={match.s_dep}
              tone={match.s_dep >= 0.7 ? "valid" : "warn"}
              label={t("studentPanel.climateLabel")}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-content">{t("studentPanel.overallLabel")}</span>
              <span className="font-bold tabular-nums text-content">
                {formatPercent(match.combined_score, lang)}
              </span>
            </div>
            <ProgressBar
              value={match.combined_score}
              tone={match.combined_score >= 0.7 ? "valid" : "accent"}
              label={t("studentPanel.overallLabel")}
            />
          </div>
        </div>

        {/* Contrast: What Matches vs What NEVER Matches */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Positive Side */}
          <div className="space-y-4 rounded-xl border border-status-valid/50 bg-status-valid/10 p-4">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-sm font-bold text-status-valid sm:text-base">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("studentPanel.matchesTitle")}</span>
              </h3>
              <p className="text-xs text-content-muted">{t("studentPanel.matchesSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {topMatches.map((delta) => (
                <div
                  key={delta.variable}
                  className="rounded-lg border border-border-subtle bg-surface-elevated p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-content">
                      {t(`variables.${delta.variable}.label`)}
                    </span>
                    <Badge variant="valid">{formatPercent(delta.similarity_score, lang)}</Badge>
                  </div>
                  <p className="mt-1 tabular-nums text-content-muted">
                    {t("studentPanel.targetShort")}:{" "}
                    <strong className="text-content">
                      {formatNumber(delta.planetary_value, lang, 1)}
                    </strong>{" "}
                    · {t("studentPanel.earthShort")}:{" "}
                    <strong className="text-content">
                      {formatNumber(delta.earth_value, lang, 1)}
                    </strong>
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-status-valid/30 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-content">
                {t("studentPanel.experimentsCanTestTitle")}
              </p>
              <ul className="space-y-1.5">
                {recs.valid_tests.map((testKey) => (
                  <li key={testKey} className="flex items-start gap-2 text-xs text-content sm:text-sm">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-valid"
                      aria-hidden="true"
                    />
                    <span>{t(testKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Negative Side / Physical Honesty */}
          <div className="space-y-4 rounded-xl border border-status-break/50 bg-status-break/10 p-4">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-sm font-bold text-status-break sm:text-base">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("studentPanel.differencesTitle")}</span>
              </h3>
              <p className="text-xs text-content-muted">{t("studentPanel.differencesSubtitle")}</p>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-content">
              <div className="rounded-lg border border-border-subtle bg-surface-elevated p-2.5">
                <strong>{t("studentPanel.limits.gravityTitle")}:</strong>{" "}
                {t("studentPanel.limits.gravityBody", {
                  body: t(`bodies.${comparison.site.body}`),
                  g: formatNumber(gravityG, lang, 2),
                })}
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface-elevated p-2.5">
                <strong>{t("studentPanel.limits.airTitle")}:</strong>{" "}
                {t(isMoon ? "studentPanel.limits.airMoon" : "studentPanel.limits.airMars", {
                  pressure: formatNumber(pressureMbar, lang, 1),
                })}
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface-elevated p-2.5">
                <strong>{t("studentPanel.limits.radiationTitle")}:</strong>{" "}
                {t("studentPanel.limits.radiationBody", {
                  rad: formatNumber(radiationMsv, lang, 0),
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-status-break/30 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-content">
                {t("studentPanel.experimentsCannotTestTitle")}
              </p>
              <ul className="space-y-1.5">
                {recs.invalid_tests.map((testKey) => (
                  <li key={testKey} className="flex items-start gap-2 text-xs text-content sm:text-sm">
                    <XCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-break"
                      aria-hidden="true"
                    />
                    <span>{t(testKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Guided AI Explanation (explorer reading mode) */}
        <AiViabilityPanel
          comparison={comparison}
          readingMode="explorer"
          modelType="ridge"
          distanceMetric="euclidean"
          testProfile="causal_auto"
          penalizeEstimated={false}
          catalogContext={null}
          aiEnabled={aiEnabled}
          analysis={aiAnalysis}
          onAnalysisChange={onAiAnalysisChange}
        />

        {/* Quick-Jump Top Earth Comparisons */}
        {quickDiscoveries.length > 1 && (
          <div className="space-y-2.5 border-t border-border-subtle pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              {t("studentPanel.tryOtherPlaces")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {quickDiscoveries.map((item) => {
                const active = item.earth_cell_h3 === match.earth_cell_h3;
                const label = item.known_analog_name ?? t(item.region_key);
                return (
                  <button
                    key={item.earth_cell_h3}
                    type="button"
                    onClick={() => onSelectCell(item.earth_cell_h3)}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      active
                        ? "border-accent bg-accent/10 font-semibold text-content"
                        : "border-border-subtle bg-surface text-content-muted hover:border-accent/50 hover:text-content"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </span>
                    <Badge variant={item.is_benchmark ? "default" : "valid"}>
                      {formatPercent(item.combined_score, lang)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <Button variant="primary" onClick={onOpenLearn}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t("studentPanel.goToPhysicsLab")}</span>
          </Button>
          <Button variant="secondary" onClick={onSwitchToScientific}>
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            <span>{t("studentPanel.switchToScienceCta")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
