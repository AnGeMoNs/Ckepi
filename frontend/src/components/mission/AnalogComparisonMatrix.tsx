import { LayoutGroup, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search, X } from "lucide-react";
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
import { ScoreGauge, widthClass } from "../explore/ScoreGauge";
import { Pictogram } from "../worlds/Pictograms";

interface AnalogComparisonMatrixProps {
  matches: AnalogMatchItem[];
  selectedH3: string | null;
  selectedMatchOverride?: AnalogMatchItem | null;
  activeSite?: PlanetarySite;
  aiAnalysis?: MissionAiAnalysisResponse | null;
  onSelectCell: (h3Index: string) => void;
  onExported?: () => void;
}

type MatrixSortField = "combined" | "s_ind" | "s_dep" | "r_break";
type MatrixCategory = "all" | "discovery" | "benchmark" | "pareto";

export function AnalogComparisonMatrix({
  matches,
  selectedH3,
  selectedMatchOverride = null,
  activeSite,
  aiAnalysis = null,
  onSelectCell,
  onExported,
}: AnalogComparisonMatrixProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [sortField, setSortField] = useState<MatrixSortField>("combined");
  const [sortAsc, setSortAsc] = useState(false);
  const [category, setCategory] = useState<MatrixCategory>("all");
  const [limitCount, setLimitCount] = useState<number>(10);
  const [query, setQuery] = useState("");

  const originalRankMap = useMemo(() => {
    const map = new Map<string, number>();
    matches.forEach((m, idx) => map.set(m.earth_cell_h3, idx + 1));
    return map;
  }, [matches]);

  const sortedCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = matches.filter((m) => {
      if (category === "discovery" && m.is_benchmark) return false;
      if (category === "benchmark" && !m.is_benchmark) return false;
      if (category === "pareto" && !m.is_pareto_optimal) return false;
      if (q) {
        const reg = (m.known_analog_name ?? t(m.region_key)).toLowerCase();
        const bio = t(m.biome_key).toLowerCase();
        if (!reg.includes(q) && !bio.includes(q) && !m.earth_cell_h3.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    const dir = sortAsc ? 1 : -1;
    return [...filtered]
      .sort((a, b) => {
        if (sortField === "combined") return (a.combined_score - b.combined_score) * dir;
        if (sortField === "s_ind") return (a.s_ind - b.s_ind) * dir;
        if (sortField === "s_dep") return (a.s_dep - b.s_dep) * dir;
        return (a.r_break_overall - b.r_break_overall) * dir;
      })
      .slice(0, limitCount);
  }, [matches, category, query, sortField, sortAsc, limitCount, t]);

  if (matches.length === 0) return null;

  const handleSortCol = (field: MatrixSortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(field === "r_break");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/img/planets/ckepi-planet-science.webp" alt="" width={64} height={64} draggable={false} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo sm:h-14 sm:w-14" />
          <div className="min-w-0">
            <CardTitle>{t("comparisonMatrix.title")}</CardTitle>
            <p className="mt-0.5 text-sm text-content-muted">{t("comparisonMatrix.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              exportMatchesToCsv(matches, activeSite?.site_id ?? "site", (k) => t(k));
              onExported?.();
            }}
          >
            <Pictogram name="download" className="h-5 w-5" />
            <span>CSV</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              exportMatchesToGeoJson(matches, activeSite?.site_id ?? "site", (k) => t(k));
              onExported?.();
            }}
          >
            <Pictogram name="download" className="h-5 w-5" />
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
                  (selectedMatchOverride?.earth_cell_h3 === selectedH3 ? selectedMatchOverride : null)
                    ?? matches.find((m) => m.earth_cell_h3 === selectedH3) ?? matches[0],
                  lang,
                  aiAnalysis
                );
                onExported?.();
              }}
            >
              <Pictogram name="download" className="h-5 w-5" />
              <span>{t("comparisonMatrix.exportReport")}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {/* Filter & Sort Controls */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <LayoutGroup id="matrix-category">
          <div role="group" aria-label={t("comparisonMatrix.title")} className="ckepi-liquid no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full p-1.5">
            {(
              [
                { id: "all", label: t("map.filters.category.all") },
                { id: "discovery", label: t("map.filters.category.discovery") },
                { id: "benchmark", label: t("map.filters.category.benchmark") },
                { id: "pareto", label: t("map.filters.category.pareto") },
              ] as const
            ).map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(cat.id)}
                  className={`relative min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active ? "text-content" : "text-content-muted hover:text-content"
                  }`}
                >
                  {active && <motion.span layoutId="matrix-category-lens" aria-hidden="true" className="ckepi-liquid ckepi-liquid-glow absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <span className="relative">{cat.label}</span>
                </button>
              );
            })}
          </div>
          </LayoutGroup>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-52 sm:flex-initial">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("map.filters.searchPlaceholder")}
                aria-label={t("map.filters.searchPlaceholder")}
                className="ckepi-liquid min-h-11 w-full rounded-full pl-9 pr-8 text-sm text-content placeholder:text-content-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <select
              aria-label={t("comparisonMatrix.showRows")}
              value={limitCount}
              onChange={(e) => setLimitCount(Number(e.target.value))}
              className="ckepi-liquid min-h-11 rounded-full px-4 text-sm font-semibold tabular-nums text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {[4, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {t("comparisonMatrix.topCount", { count: n })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Stacked Cards (<640px) */}
        <div className="grid grid-cols-1 gap-3 sm:hidden">
          {sortedCandidates.map((m, idx) => {
            const isActive = m.earth_cell_h3 === selectedH3;
            const rank = originalRankMap.get(m.earth_cell_h3) ?? idx + 1;
            return (
              <button
                key={m.earth_cell_h3}
                type="button"
                onClick={() => onSelectCell(m.earth_cell_h3)}
                className={`ckepi-liquid min-h-11 w-full rounded-3xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "ckepi-liquid-glow" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-content">
                    #{rank} · {m.known_analog_name ?? t(m.region_key)}
                  </span>
                  <span className="font-mono text-xl font-semibold tabular-nums text-content">
                    {formatPercent(m.combined_score, lang)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {m.is_pareto_optimal && (
                    <Badge variant="accent">{t("mission.paretoBadge")}</Badge>
                  )}
                  <Badge variant={m.is_benchmark ? "default" : "valid"}>
                    {m.is_benchmark ? t("map.benchmarkBadge") : t("map.discoveryBadge")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-content-muted">
                  {t(m.biome_key)} · ({formatNumber(m.coordinates.lat, lang, 2)},{" "}
                  {formatNumber(m.coordinates.lon, lang, 2)})
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <ScoreGauge label="S_ind" value={m.s_ind} />
                  <ScoreGauge label="S_dep" value={m.s_dep} />
                  <ScoreGauge label="R_break" value={m.r_break_overall} tone="break" />
                </div>
                <p className="mt-3 text-sm text-content">
                  {m.engineering_recommendations.valid_tests[0]
                    ? t(m.engineering_recommendations.valid_tests[0])
                    : ""}
                </p>
              </button>
            );
          })}
        </div>

        {/* Desktop / Tablet Comparison Table */}
        <div className="ckepi-liquid hidden overflow-x-auto rounded-3xl sm:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border-subtle/50 text-xs uppercase tracking-wider text-content-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("comparisonMatrix.siteCol")}</th>
                <th className="px-4 py-3 font-semibold">{t("comparisonMatrix.typeCol")}</th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSortCol("combined")}
                    className="inline-flex items-center gap-1 font-semibold uppercase hover:text-content"
                  >
                    <span>{t("comparisonMatrix.combinedCol")}</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSortCol("s_ind")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-content"
                    >
                      <span>S_ind</span>
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <InfoTooltip label="S_ind" text={t("comparisonMatrix.sIndTooltip")} />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSortCol("s_dep")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-content"
                    >
                      <span>S_dep</span>
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <InfoTooltip label="S_dep" text={t("comparisonMatrix.sDepTooltip")} />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSortCol("r_break")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-content"
                    >
                      <span>R_break</span>
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <InfoTooltip label="R_break" text={t("comparisonMatrix.rBreakTooltip")} />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">{t("comparisonMatrix.bestTestCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-elevated">
              {sortedCandidates.map((m, idx) => {
                const isActive = m.earth_cell_h3 === selectedH3;
                const rank = originalRankMap.get(m.earth_cell_h3) ?? idx + 1;
                const topTest = m.engineering_recommendations.valid_tests[0];
                return (
                  <tr
                    key={m.earth_cell_h3}
                    onClick={() => onSelectCell(m.earth_cell_h3)}
                    className={`cursor-pointer border-b border-border-subtle/30 transition-colors last:border-b-0 ${
                      isActive ? "bg-accent/15" : "hover:bg-surface-muted/40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-content">
                        #{rank} · {m.known_analog_name ?? t(m.region_key)}
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
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="font-mono text-base font-semibold tabular-nums text-content">
                          {formatPercent(m.combined_score, lang)}
                        </span>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface/60 shadow-inner">
                          <div className={`h-full rounded-full bg-accent ${widthClass(m.combined_score)}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums text-content">
                      {formatPercent(m.s_ind, lang)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums text-content">
                      {formatPercent(m.s_dep, lang)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums text-status-break">
                      {formatPercent(m.r_break_overall, lang)}
                    </td>
                    <td className="px-4 py-3 text-sm text-content">
                      {topTest ? t(topTest) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-sm text-content-muted">{t("mission.disclaimer")}</p>
      </CardContent>
    </Card>
  );
}

