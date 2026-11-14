import { Download, GitCompareArrows } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type {
  AnalogMatchItem,
  MissionAiAnalysisResponse,
  PlanetarySite,
} from "../../types/analog";
import {
  exportMatchesToCsv,
  exportMatchesToGeoJson,
  exportReportMarkdown,
} from "../../utils/exportResults";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { InfoTooltip } from "../ui/InfoTooltip";

interface AnalogComparisonMatrixProps {
  matches: AnalogMatchItem[];
  selectedH3: string | null;
  activeSite?: PlanetarySite;
  aiAnalysis?: MissionAiAnalysisResponse | null;
  onSelectCell: (h3Index: string) => void;
  onExported?: () => void;
}

export function AnalogComparisonMatrix({
  matches,
  selectedH3,
  activeSite,
  aiAnalysis = null,
  onSelectCell,
  onExported,
}: AnalogComparisonMatrixProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  if (matches.length === 0) return null;

  // Pick top 4 distinct cells (ensuring at least 1 discovery & 1 benchmark if available)
  const topCandidates: AnalogMatchItem[] = matches.slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-accent" aria-hidden="true" />
            <CardTitle>{t("comparisonMatrix.title")}</CardTitle>
          </div>
          <span className="text-xs text-content-muted">{t("comparisonMatrix.subtitle")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              exportMatchesToCsv(matches, activeSite?.site_id ?? "site", (k) => t(k));
              onExported?.();
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>CSV</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              exportMatchesToGeoJson(matches, activeSite?.site_id ?? "site", (k) => t(k));
              onExported?.();
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>GeoJSON</span>
          </Button>
          {activeSite && (
            <Button
              variant="secondary"
              onClick={() => {
                exportReportMarkdown(
                  activeSite,
                  matches,
                  (k, p) => t(k, p),
                  matches.find((m) => m.earth_cell_h3 === selectedH3) ?? matches[0],
                  lang,
                  aiAnalysis
                );
                onExported?.();
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{t("comparisonMatrix.exportReport")}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Mobile Stacked Cards (<640px) */}
        <div className="grid grid-cols-1 gap-3 sm:hidden">
          {topCandidates.map((m, idx) => {
            const isActive = m.earth_cell_h3 === selectedH3;
            return (
              <button
                key={m.earth_cell_h3}
                type="button"
                onClick={() => onSelectCell(m.earth_cell_h3)}
                className={`min-h-11 w-full rounded border p-3.5 text-left transition ${
                  isActive
                    ? "border-accent bg-accent/10"
                    : "border-border-subtle bg-surface hover:border-accent/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-content">
                    #{idx + 1} · {t(m.region_key)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {m.is_pareto_optimal && (
                      <Badge variant="accent">{t("mission.paretoBadge")}</Badge>
                    )}
                    <Badge variant={m.is_benchmark ? "default" : "valid"}>
                      {m.is_benchmark ? t("map.benchmarkBadge") : t("map.discoveryBadge")}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-content-muted">
                  {t(m.biome_key)} · ({formatNumber(m.coordinates.lat, lang, 2)},{" "}
                  {formatNumber(m.coordinates.lon, lang, 2)})
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums">
                  <div>
                    <span className="text-content-muted">S_ind:</span>{" "}
                    <span className="font-semibold text-accent">{formatPercent(m.s_ind, lang)}</span>
                  </div>
                  <div>
                    <span className="text-content-muted">S_dep:</span>{" "}
                    <span className="font-semibold text-status-valid">
                      {formatPercent(m.s_dep, lang)}
                    </span>
                  </div>
                  <div>
                    <span className="text-content-muted">R_break:</span>{" "}
                    <span className="font-semibold text-status-break">
                      {formatPercent(m.r_break_overall, lang)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-content">
                  {m.engineering_recommendations.valid_tests[0]
                    ? t(m.engineering_recommendations.valid_tests[0])
                    : ""}
                </p>
              </button>
            );
          })}
        </div>

        {/* Desktop / Tablet Comparison Table */}
        <div className="hidden overflow-x-auto rounded border border-border-subtle sm:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-content-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("comparisonMatrix.siteCol")}</th>
                <th className="px-4 py-3 font-semibold">{t("comparisonMatrix.typeCol")}</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-0.5">
                    S_ind
                    <InfoTooltip label="S_ind" text={t("comparisonMatrix.sIndTooltip")} />
                  </span>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-0.5">
                    S_dep
                    <InfoTooltip label="S_dep" text={t("comparisonMatrix.sDepTooltip")} />
                  </span>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-0.5">
                    R_break
                    <InfoTooltip label="R_break" text={t("comparisonMatrix.rBreakTooltip")} />
                  </span>
                </th>
                <th className="px-4 py-3 font-semibold">{t("comparisonMatrix.bestTestCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-elevated">
              {topCandidates.map((m, idx) => {
                const isActive = m.earth_cell_h3 === selectedH3;
                const topTest = m.engineering_recommendations.valid_tests[0];
                return (
                  <tr
                    key={m.earth_cell_h3}
                    onClick={() => onSelectCell(m.earth_cell_h3)}
                    className={`cursor-pointer transition ${
                      isActive ? "bg-accent/10" : "hover:bg-surface-muted/60"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-content">
                        #{idx + 1} · {t(m.region_key)}
                      </p>
                      <p className="text-xs text-content-muted">
                        {t(m.biome_key)} · {formatNumber(m.coordinates.lat, lang, 2)},{" "}
                        {formatNumber(m.coordinates.lon, lang, 2)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={m.is_benchmark ? "default" : "valid"}>
                          {m.is_benchmark ? t("map.benchmarkBadge") : t("map.discoveryBadge")}
                        </Badge>
                        {m.is_pareto_optimal && (
                          <Badge variant="accent">{t("mission.paretoBadge")}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-accent">
                      {formatPercent(m.s_ind, lang)}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-status-valid">
                      {formatPercent(m.s_dep, lang)}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-status-break">
                      {formatPercent(m.r_break_overall, lang)}
                    </td>
                    <td className="px-4 py-3 text-xs text-content">
                      {topTest ? t(topTest) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-content-muted">
          {t("mission.nasaAttribution")} · {t("mission.disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}

