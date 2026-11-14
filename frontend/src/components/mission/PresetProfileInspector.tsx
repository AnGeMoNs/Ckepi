import { ChevronDown, ChevronUp, Eye, Sliders } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatPercent } from "../../i18n";
import type { TestProfileType } from "../../types/analog";
import { Button } from "../ui/Button";
import { InfoTooltip } from "../ui/InfoTooltip";
import { ProgressBar } from "../ui/ProgressBar";

interface PresetProfileInspectorProps {
  testProfile: Exclude<TestProfileType, "manual_custom">;
  weightsUsed: Record<string, number>;
  onCloneToManual: (weights: Record<string, number>) => void;
}

export function PresetProfileInspector({
  testProfile,
  weightsUsed,
  onCloneToManual,
}: PresetProfileInspectorProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [expanded, setExpanded] = useState(false);

  const sortedWeights = Object.entries(weightsUsed)
    .filter(([, w]) => w > 0.001)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded border border-border-subtle bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-content-muted">
          <Eye className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>{t(`controls.profileDescriptions.${testProfile}`)}</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border-subtle bg-surface-elevated px-3 text-xs font-medium text-content transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span>
            {expanded
              ? t("controls.profileInspector.showLess")
              : t("controls.profileInspector.showMore")}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border-subtle pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              {t("controls.profileInspector.weightsTitle")}
            </h3>
            <Button variant="secondary" onClick={() => onCloneToManual(weightsUsed)}>
              <Sliders className="h-4 w-4" aria-hidden="true" />
              <span>{t("controls.profileInspector.editInManual")}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedWeights.map(([varKey, weight]) => {
              const label = t(`variables.${varKey}.label`);
              return (
                <div
                  key={varKey}
                  className="space-y-1.5 rounded border border-border-subtle bg-surface-elevated p-2.5"
                >
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-0.5">
                      <span className="font-medium text-content">{label}</span>
                      <InfoTooltip label={label} text={t(`variables.${varKey}.hint`)} />
                    </div>
                    <span className="tabular-nums font-semibold text-accent">
                      {formatPercent(weight, lang)}
                    </span>
                  </div>
                  <ProgressBar value={weight} tone="accent" label={label} />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-content-muted">
            {t("controls.profileInspector.zeroVarsNote")}
          </p>
        </div>
      )}
    </div>
  );
}

