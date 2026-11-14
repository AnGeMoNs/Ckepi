import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Compass,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiClientError, requestMissionAiAnalysis } from "../../api/client";
import { formatTimestamp, normalizeSupportedLocale } from "../../i18n";
import type {
  DecompositionModelType,
  DistanceMetricType,
  MissionAiAnalysisResponse,
  MultiAgencyCatalogResponse,
  ReadingMode,
  SiteComparisonResponse,
  TestProfileType,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

interface AiViabilityPanelProps {
  comparison: SiteComparisonResponse;
  readingMode: ReadingMode;
  modelType: DecompositionModelType;
  distanceMetric: DistanceMetricType;
  testProfile: TestProfileType;
  penalizeEstimated: boolean;
  customIvWeights?: Record<string, number>;
  customDvWeights?: Record<string, number>;
  customMinSimilarity?: Record<string, number>;
  catalogContext: MultiAgencyCatalogResponse | null;
  aiEnabled: boolean;
  analysis: MissionAiAnalysisResponse | null;
  onAnalysisChange: (next: MissionAiAnalysisResponse | null) => void;
}

export function AiViabilityPanel({
  comparison,
  readingMode,
  modelType,
  distanceMetric,
  testProfile,
  penalizeEstimated,
  customIvWeights,
  customDvWeights,
  customMinSimilarity,
  catalogContext,
  aiEnabled,
  analysis,
  onAnalysisChange,
}: AiViabilityPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const locale = normalizeSupportedLocale(lang);
  const siteId = comparison.site.site_id;
  const h3Index = comparison.match.earth_cell_h3;

  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const activeAbortRef = useRef<AbortController | null>(null);

  const resolveVariableLabel = useCallback(
    (varKey: string): string => {
      const i18nKey = `variables.${varKey}.label`;
      return i18n.exists(i18nKey) ? t(i18nKey) : varKey;
    },
    [i18n, t]
  );

  const buildPayload = useCallback(
    (options: { cacheOnly: boolean; forceRefresh: boolean }) => ({
      site_id: siteId,
      earth_cell_h3: h3Index,
      model_type: modelType,
      distance_metric: distanceMetric,
      test_profile: testProfile,
      reading_mode: readingMode,
      locale,
      penalize_estimated: penalizeEstimated,
      custom_iv_weights: testProfile === "manual_custom" ? customIvWeights : undefined,
      custom_dv_weights: testProfile === "manual_custom" ? customDvWeights : undefined,
      custom_min_similarity: testProfile === "manual_custom" ? customMinSimilarity : undefined,
      catalog_context: catalogContext ?? undefined,
      cache_only: options.cacheOnly,
      force_refresh: options.forceRefresh,
    }),
    [
      siteId,
      h3Index,
      modelType,
      distanceMetric,
      testProfile,
      readingMode,
      locale,
      penalizeEstimated,
      customIvWeights,
      customDvWeights,
      customMinSimilarity,
      catalogContext,
    ]
  );

  // Clear stale AI result when target context changes and silently hydrate from DuckDB cache if available
  useEffect(() => {
    activeAbortRef.current?.abort();
    const controller = new AbortController();
    activeAbortRef.current = controller;
    setErrorKey(null);
    setIsLoading(false);

    if (
      analysis &&
      (analysis.site_id !== siteId ||
        analysis.earth_cell_h3 !== h3Index ||
        analysis.locale !== locale ||
        analysis.reading_mode !== readingMode ||
        analysis.test_profile !== testProfile)
    ) {
      onAnalysisChange(null);
    }

    requestMissionAiAnalysis(buildPayload({ cacheOnly: true, forceRefresh: false }), controller.signal)
      .then((cached) => {
        if (!controller.signal.aborted && cached) {
          onAnalysisChange(cached);
        }
      })
      .catch(() => {
        // Silent cache probe: do not surface transient errors before user requests synthesis
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    siteId,
    h3Index,
    modelType,
    distanceMetric,
    testProfile,
    readingMode,
    locale,
    penalizeEstimated,
    customIvWeights,
    customDvWeights,
    customMinSimilarity,
  ]);

  const handleGenerate = async (forceRefresh: boolean) => {
    activeAbortRef.current?.abort();
    const controller = new AbortController();
    activeAbortRef.current = controller;
    setIsLoading(true);
    setErrorKey(null);

    try {
      const result = await requestMissionAiAnalysis(
        buildPayload({ cacheOnly: false, forceRefresh }),
        controller.signal
      );
      if (!controller.signal.aborted && result) {
        onAnalysisChange(result);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof ApiClientError) {
        setErrorKey(err.errorKey);
      } else {
        setErrorKey("errors.ai_provider_unavailable");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const formattedGeneratedAt = analysis
    ? formatTimestamp(new Date(analysis.generated_at), lang)
    : null;

  return (
    <div className="rounded border border-border-subtle bg-surface p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-content">{t("mission.ai.title")}</h3>
          <Badge variant="accent">{t("mission.ai.badge")}</Badge>
          {analysis?.cached && <Badge variant="default">{t("mission.ai.cachedBadge")}</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {analysis && (
            <span className="text-xs text-content-muted">
              {t("mission.ai.modelLabel", { model: analysis.model_used })}
              {formattedGeneratedAt ? ` · ${formattedGeneratedAt}` : ""}
            </span>
          )}
          {aiEnabled && analysis && !isLoading && (
            <Button
              variant="secondary"
              onClick={() => void handleGenerate(true)}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("mission.ai.regenerateButton")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Disabled notice */}
      {!aiEnabled && !analysis && (
        <p className="rounded border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
          {t("mission.ai.notConfiguredNote")}
        </p>
      )}

      {/* Initial CTA */}
      {aiEnabled && !analysis && !isLoading && !errorKey && (
        <div className="flex flex-col gap-3 rounded border border-border-subtle bg-surface-elevated p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-content-muted">
            {t("mission.ai.readyDescription")}
          </p>
          <Button
            variant="primary"
            className="shrink-0"
            onClick={() => void handleGenerate(false)}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t("mission.ai.generateButton")}</span>
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div aria-live="polite" aria-busy="true" className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-medium text-accent">
            <RefreshCw
              className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>{t("mission.ai.generatingButton")}</span>
          </p>
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      )}

      {/* Error state */}
      {errorKey && !isLoading && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded border border-status-break/40 bg-status-break/10 p-3 text-xs text-status-break"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t(errorKey)}</span>
          </div>
          <Button variant="secondary" onClick={() => void handleGenerate(false)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("mission.ai.retryButton")}</span>
          </Button>
        </div>
      )}

      {/* Structured AI Viability Content */}
      {analysis && !isLoading && (
        <div className="space-y-4">
          {/* Executive Synthesis & Viability Assessment */}
          <div className="rounded border border-accent/30 bg-accent/5 p-3.5 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("mission.ai.executiveTitle")}
            </h4>
            <p className="text-xs leading-relaxed text-content sm:text-sm">
              {analysis.executive_synthesis}
            </p>
            <p className="text-xs leading-relaxed text-content-muted">
              {analysis.viability_assessment}
            </p>
          </div>

          {/* Uncertainty & H3 Spatial Scale */}
          <div className="rounded border border-border-subtle bg-surface-elevated p-3.5 space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-content">
              <Compass className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{t("mission.ai.scaleConfidenceTitle")}</span>
            </h4>
            <p className="text-xs leading-relaxed text-content-muted">
              {analysis.confidence_and_scale_note}
            </p>
          </div>

          {/* Strengths vs Physical Gaps */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded border border-status-valid/50 bg-status-valid/10 p-3.5 space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-status-valid">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("mission.ai.strengthsTitle")}</span>
              </h4>
              <ul className="space-y-2.5">
                {analysis.key_strengths.map((item, idx) => (
                  <li key={`${item.title}-${idx}`} className="space-y-1 text-xs">
                    <p className="font-semibold text-content">{item.title}</p>
                    <p className="leading-relaxed text-content-muted">{item.detail}</p>
                    {item.related_variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.related_variables.map((v) => (
                          <Badge key={v} variant="valid">
                            {resolveVariableLabel(v)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-status-warn/50 bg-status-warn/10 p-3.5 space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-status-warn">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("mission.ai.limitationsTitle")}</span>
              </h4>
              <ul className="space-y-2.5">
                {analysis.physical_limitations_and_gaps.map((item, idx) => (
                  <li key={`${item.title}-${idx}`} className="space-y-1 text-xs">
                    <p className="font-semibold text-content">{item.title}</p>
                    <p className="leading-relaxed text-content-muted">{item.detail}</p>
                    {item.related_variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.related_variables.map((v) => (
                          <Badge key={v} variant="warn">
                            {resolveVariableLabel(v)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Breakage Mitigation Plan */}
          {analysis.breakage_mitigation_plan.length > 0 && (
            <div className="rounded border border-status-break/40 bg-status-break/5 p-3.5 space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-status-break">
                <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("mission.ai.mitigationsTitle")}</span>
              </h4>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                {analysis.breakage_mitigation_plan.map((item, idx) => (
                  <div
                    key={`${item.variable}-${idx}`}
                    className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1.5 text-xs"
                  >
                    <Badge variant="break">{resolveVariableLabel(item.variable)}</Badge>
                    <p className="text-content-muted">
                      <span className="font-semibold text-content">
                        {t("mission.ai.impactLabel")}:{" "}
                      </span>
                      {item.earth_gap_impact}
                    </p>
                    <p className="text-content-muted">
                      <span className="font-semibold text-content">
                        {t("mission.ai.protocolLabel")}:{" "}
                      </span>
                      {item.recommended_facility_or_protocol}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Considerations & Next Steps */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded border border-border-subtle bg-surface-elevated p-3.5 space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-content">
                <ClipboardList className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{t("mission.ai.considerationsTitle")}</span>
              </h4>
              <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-content-muted">
                {analysis.field_campaign_considerations.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-border-subtle bg-surface-elevated p-3.5 space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-content">
                <Sparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{t("mission.ai.nextStepsTitle")}</span>
              </h4>
              <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-content-muted">
                {analysis.recommended_next_steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="border-t border-border-subtle pt-2 text-[11px] text-content-muted">
            {t("mission.ai.includedInReport")} · {t("mission.ai.disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
