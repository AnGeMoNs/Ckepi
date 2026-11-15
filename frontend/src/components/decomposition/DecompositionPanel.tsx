import { useTranslation } from "react-i18next";
import { Pictogram } from "../worlds/Pictograms";

import { formatNumber, formatPercent, formatTimestamp } from "../../i18n";
import type { DecompositionResponse } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

interface DecompositionPanelProps {
  decomposition: DecompositionResponse;
}

export function DecompositionPanel({ decomposition }: DecompositionPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const sortedWeights = Object.entries(decomposition.global_iv_weights).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pictogram name="hexCell" className="h-5 w-5 text-accent" />
          <CardTitle>{t("decomposition.title")}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={decomposition.body === "mars" ? "mars" : "moon"}>
            {t(`bodies.${decomposition.body}`)}
          </Badge>
          <Badge variant="default">
            {t("decomposition.sampleCount")}: {formatNumber(decomposition.sample_count, lang, 0)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-subtle/50 bg-surface/30 px-3 py-2 text-xs text-content-muted">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-content">{t("provenance.title")}:</span>
            {decomposition.provenance.source_apis.map((api) => (
              <Badge key={api} variant="accent">
                {api}
              </Badge>
            ))}
          </div>
          <span>
            {t("provenance.window")}: <strong className="text-content">{decomposition.provenance.observation_window}</strong>
            {" · "}
            {formatTimestamp(new Date(decomposition.provenance.fetched_at), lang)}
          </span>
        </div>

        <p className="text-sm text-content-muted">{t("decomposition.subtitle")}</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Independent Variable Causal Weights */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
              <Pictogram name="tune" className="h-4 w-4 text-accent" />
              {t("decomposition.independentTitle")}
            </h3>
            <ul className="space-y-3">
              {sortedWeights.map(([varName, weight]) => (
                <li key={varName} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-medium text-content">
                      {t(`variables.${varName}.label`)}
                    </span>
                    <span className="tabular-nums font-semibold text-accent">
                      {formatPercent(weight, lang)}
                    </span>
                  </div>
                  <ProgressBar
                    value={weight}
                    tone="accent"
                    label={t(`variables.${varName}.label`)}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Dependent Variable Explained Variance R^2 & PCA */}
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-content">
                {t("decomposition.dependentTitle")}
              </h3>
              <ul className="space-y-3">
                {decomposition.dependent_models.map((dv) => (
                  <li key={dv.dv_name} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="font-medium text-content">
                        {t(`variables.${dv.dv_name}.label`)}
                      </span>
                      {dv.is_available ? (
                        <span className="tabular-nums text-content-muted">
                          {t("decomposition.r2Label")}:{" "}
                          <strong className="text-content">
                            {formatPercent(dv.r2_score, lang)}
                          </strong>
                          {typeof dv.cv_r2_score === "number" && dv.cv_r2_score > 0 && (
                            <span className="ml-1.5 text-xs text-content-muted">
                              (CV: {formatPercent(dv.cv_r2_score, lang)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs italic text-content-muted">
                          {t("decomposition.notMeasured")}
                        </span>
                      )}
                    </div>
                    <ProgressBar
                      value={dv.is_available ? dv.r2_score : 0}
                      tone={dv.r2_score >= 0.6 ? "valid" : "warn"}
                      label={t(`variables.${dv.dv_name}.label`)}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-content">{t("decomposition.pcaTitle")}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {decomposition.pca_components.map((pc) => (
                  <div
                    key={pc.component_index}
                    className="rounded-2xl border border-border-subtle/50 bg-surface/30 p-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-content">
                      <span>{t("decomposition.componentLabel", { index: pc.component_index })}</span>
                      <span className="text-accent">
                        {formatPercent(pc.explained_variance_ratio, lang)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-content-muted">
                      {Object.keys(pc.top_loadings)
                        .slice(0, 2)
                        .map((k) => t(`variables.${k}.label`))
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Breakage Boundaries */}
        <div className="space-y-3 rounded-2xl border border-status-break/60 bg-status-break/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-status-break">
              <Pictogram name="notSimilar" className="h-4 w-4 shrink-0" />
              {t("decomposition.breakageTitle")}
            </h3>
            <span className="text-xs text-content-muted">
              {t("decomposition.breakageThresholdNote")}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {decomposition.breakage_profile.map((b) => (
              <div
                key={b.variable}
                className="ckepi-liquid rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-content">
                    {t(`variables.${b.variable}.label`)}
                  </span>
                  <Badge variant={b.is_broken ? "break" : "valid"}>
                    {formatPercent(b.breakage_index, lang)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-content-muted tabular-nums">
                  <span>
                    {formatNumber(b.planetary_value, lang, 3)}{" "}
                    {t(`variables.${b.variable}.unit`)}
                  </span>
                  <span>vs {formatNumber(b.earth_baseline_value, lang, 2)}</span>
                </div>
                {b.is_broken && (
                  <p className="flex items-start gap-1.5 text-xs text-status-break">
                    <Pictogram name="notSimilar" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t(b.alert_key)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

