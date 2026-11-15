import { Compass, Eye, Filter, Layers, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type { AnalogMatchItem, PlanetarySite } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface UnexpectedDiscoverySpotlightProps {
  matches: AnalogMatchItem[];
  totalEvaluated: number;
  selectedH3: string | null;
  excludeBenchmarks: boolean;
  site?: PlanetarySite;
  onSelectCell: (h3Index: string) => void;
  onToggleExcludeBenchmarks: (next: boolean) => void;
}

function getTopDrivers(item: AnalogMatchItem): Array<[string, number]> {
  return [
    ...Object.entries(item.iv_similarity_breakdown),
    ...Object.entries(item.dv_similarity_breakdown),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

export function UnexpectedDiscoverySpotlight({
  matches,
  totalEvaluated,
  selectedH3,
  excludeBenchmarks,
  site,
  onSelectCell,
  onToggleExcludeBenchmarks,
}: UnexpectedDiscoverySpotlightProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const stats = useMemo(() => {
    const discoveries = matches.filter((m) => !m.is_benchmark);
    const benchmarks = matches.filter((m) => m.is_benchmark);
    const paretoDiscoveries = discoveries.filter((m) => m.is_pareto_optimal);
    return {
      discoveries,
      benchmarks,
      topDiscovery: discoveries[0] ?? null,
      topBenchmark: benchmarks[0] ?? null,
      otherDiscoveries: discoveries.slice(1, 4),
      paretoDiscoveryCount: paretoDiscoveries.length,
    };
  }, [matches]);

  if (matches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 text-status-valid" aria-hidden="true" />
            <CardTitle>{t("discoverySpotlight.title")}</CardTitle>
            <Badge variant="valid">
              {t("discoverySpotlight.candidatesBadge", {
                count: stats.discoveries.length,
                total: formatNumber(totalEvaluated, lang, 0),
              })}
            </Badge>
            {stats.paretoDiscoveryCount > 0 && (
              <Badge variant="accent">
                {t("discoverySpotlight.paretoBadge", {
                  count: stats.paretoDiscoveryCount,
                })}
              </Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-content-muted sm:text-sm">
            {t("discoverySpotlight.subtitle", {
              target: site ? t(site.name_key) : t("bodies.mars"),
            })}
          </p>
        </div>

        <Button
          variant={excludeBenchmarks ? "primary" : "secondary"}
          onClick={() => onToggleExcludeBenchmarks(!excludeBenchmarks)}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          <span>
            {excludeBenchmarks
              ? t("discoverySpotlight.showBenchmarksAction")
              : t("discoverySpotlight.onlyDiscoveriesAction")}
          </span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Top Unexpected Discovery */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl border border-status-valid/50 bg-status-valid/10 p-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-status-valid">
                  {t("discoverySpotlight.topUnexpectedLabel")}
                </span>
                {stats.topDiscovery && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {stats.topDiscovery.is_pareto_optimal && (
                      <Badge variant="valid">{t("map.paretoBadge")}</Badge>
                    )}
                    <Badge variant="accent">
                      {formatPercent(stats.topDiscovery.combined_score, lang)}
                    </Badge>
                  </div>
                )}
              </div>

              {stats.topDiscovery ? (
                <>
                  <div>
                    <p className="text-sm font-bold text-content sm:text-base">
                      {stats.topDiscovery.known_analog_name ?? t(stats.topDiscovery.region_key)}
                    </p>
                    <p className="text-xs text-content-muted">
                      {t(stats.topDiscovery.biome_key)} · {stats.topDiscovery.country_code} ·{" "}
                      <span className="font-mono">{stats.topDiscovery.earth_cell_h3}</span> (
                      {formatNumber(stats.topDiscovery.coordinates.lat, lang, 2)}°,{" "}
                      {formatNumber(stats.topDiscovery.coordinates.lon, lang, 2)}°)
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded border border-border-subtle bg-surface-elevated p-2">
                      <span className="block text-[11px] text-content-muted">S_ind</span>
                      <span className="font-bold tabular-nums text-accent">
                        {formatPercent(stats.topDiscovery.s_ind, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated p-2">
                      <span className="block text-[11px] text-content-muted">S_dep</span>
                      <span className="font-bold tabular-nums text-accent">
                        {formatPercent(stats.topDiscovery.s_dep, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated p-2">
                      <span className="block text-[11px] text-content-muted">R_break</span>
                      <span className="font-bold tabular-nums text-status-break">
                        {formatPercent(stats.topDiscovery.r_break_overall, lang)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {getTopDrivers(stats.topDiscovery).map(([varKey, score]) => (
                      <Badge key={varKey} variant="default">
                        {t(`variables.${varKey}.label`)}: {formatPercent(score, lang)}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-content-muted">
                  {t("discoverySpotlight.noUnexpectedHint")}
                </p>
              )}
            </div>

            {stats.topDiscovery && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant={selectedH3 === stats.topDiscovery.earth_cell_h3 ? "primary" : "secondary"}
                  onClick={() => {
                    if (stats.topDiscovery) onSelectCell(stats.topDiscovery.earth_cell_h3);
                  }}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {selectedH3 === stats.topDiscovery.earth_cell_h3
                      ? t("discoverySpotlight.currentlyInspecting")
                      : t("discoverySpotlight.inspectCandidate")}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Canonical Benchmark Control Reference */}
          <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-content-muted">
                  <Layers className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t("discoverySpotlight.canonicalControlLabel")}
                </span>
                {stats.topBenchmark && (
                  <Badge variant="default">
                    {formatPercent(stats.topBenchmark.combined_score, lang)}
                  </Badge>
                )}
              </div>

              {stats.topBenchmark ? (
                <>
                  <div>
                    <p className="text-sm font-bold text-content sm:text-base">
                      {stats.topBenchmark.known_analog_name ?? t(stats.topBenchmark.region_key)}
                    </p>
                    <p className="text-xs text-content-muted">
                      {t(stats.topBenchmark.biome_key)} · {stats.topBenchmark.country_code} ·{" "}
                      <span className="font-mono">{stats.topBenchmark.earth_cell_h3}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded border border-border-subtle bg-surface-elevated p-2">
                      <span className="block text-[11px] text-content-muted">S_ind</span>
                      <span className="font-bold tabular-nums text-content">
                        {formatPercent(stats.topBenchmark.s_ind, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated p-2">
                      <span className="block text-[11px] text-content-muted">S_dep</span>
                      <span className="font-bold tabular-nums text-content">
                        {formatPercent(stats.topBenchmark.s_dep, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated p-2">
                      <span className="block text-[11px] text-content-muted">R_break</span>
                      <span className="font-bold tabular-nums text-status-break">
                        {formatPercent(stats.topBenchmark.r_break_overall, lang)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-content-muted">
                    {stats.topDiscovery &&
                    stats.topDiscovery.combined_score >= stats.topBenchmark.combined_score - 0.03
                      ? t("discoverySpotlight.discoveryComparableNote")
                      : t("discoverySpotlight.benchmarkReferenceNote")}
                  </p>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-content-muted">
                  {t("discoverySpotlight.benchmarksExcludedNote")}
                </p>
              )}
            </div>

            {stats.topBenchmark ? (
              <div>
                <Button
                  variant={selectedH3 === stats.topBenchmark.earth_cell_h3 ? "primary" : "secondary"}
                  onClick={() => {
                    if (stats.topBenchmark) onSelectCell(stats.topBenchmark.earth_cell_h3);
                  }}
                >
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  <span>{t("discoverySpotlight.compareBenchmark")}</span>
                </Button>
              </div>
            ) : (
              <div>
                <Button variant="secondary" onClick={() => onToggleExcludeBenchmarks(false)}>
                  <span>{t("discoverySpotlight.showBenchmarksAction")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Unexpected Candidates */}
        {stats.otherDiscoveries.length > 0 && (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              {t("discoverySpotlight.moreUnexpectedTitle")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {stats.otherDiscoveries.map((item) => {
                const active = selectedH3 === item.earth_cell_h3;
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
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-content">
                        {item.known_analog_name ?? t(item.region_key)}
                      </p>
                      <p className="truncate text-[11px] text-content-muted">
                        {item.country_code} · S_ind {formatPercent(item.s_ind, lang)} · S_dep{" "}
                        {formatPercent(item.s_dep, lang)}
                      </p>
                    </div>
                    <Badge variant="valid">{formatPercent(item.combined_score, lang)}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
