import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { TestProfileType, VariableOrigin } from "../../types/analog";
import { Carousel3D } from "../explore/Carousel3D";
import { VariableCard } from "../explore/VariableCard";
import { PushButton } from "../ui/PushButton";
import { Pictogram } from "../worlds/Pictograms";
import { MANUAL_DV_KEYS, MANUAL_IV_KEYS } from "./ManualVariableControls";

interface PresetProfileInspectorProps {
  testProfile: Exclude<TestProfileType, "manual_custom">;
  weightsUsed: Record<string, number>;
  targetIndependent: Record<string, number>;
  targetDependent: Record<string, number>;
  variableProvenance?: Record<string, VariableOrigin>;
  onCloneToManual: (weights: Record<string, number>) => void;
}

/**
 * A preset test profile shown in exactly the same format as manual mode: centred title, cardboard
 * push buttons and the X / Y groups on the turning sheet — only the weights are read-only here.
 */
export function PresetProfileInspector({
  testProfile,
  weightsUsed,
  targetIndependent,
  targetDependent,
  variableProvenance,
  onCloneToManual,
}: PresetProfileInspectorProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [group, setGroup] = useState<"x" | "y">("x");

  const weightOf = (key: string) => weightsUsed[key] ?? 0;
  const activeCount = (keys: readonly string[]) => keys.filter((k) => weightOf(k) > 0.001).length;
  // Most influential variables first, so the reader sees what this test cares about.
  const byWeight = (keys: readonly string[]) => [...keys].sort((a, b) => weightOf(b) - weightOf(a));

  return (
    <div className="space-y-6 rounded-3xl border border-accent/30 bg-surface/20 p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-content sm:text-2xl">{t(`explore.profiles.${testProfile}.title`)}</h3>
          <p className="max-w-2xl text-sm text-content-muted sm:text-base">{t(`controls.profileDescriptions.${testProfile}`)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PushButton tone="ink" onClick={() => setExpanded((prev) => !prev)} aria-expanded={expanded}>
            {expanded ? t("controls.profileInspector.showLess") : t("controls.profileInspector.showMore")}
            <Pictogram name="chevronDown" className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </PushButton>
          <PushButton tone="copper" onClick={() => onCloneToManual(weightsUsed)}>
            <Pictogram name="tune" className="h-5 w-5" />
            {t("controls.profileInspector.editInManual")}
          </PushButton>
        </div>
      </div>

      {expanded && (
        <>
          <Carousel3D
            ariaLabel={t("explore.carousel.groups")}
            active={group}
            onChange={setGroup}
            panels={[
              {
                id: "x",
                title: t("manualMode.independentGroup"),
                meta: t("explore.carousel.active", { active: activeCount(MANUAL_IV_KEYS), total: MANUAL_IV_KEYS.length }),
                content: (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {byWeight(MANUAL_IV_KEYS).map((key) => (
                      <VariableCard key={key} varKey={key} target={targetIndependent[key]} origin={variableProvenance?.[key]} weight={weightOf(key)} />
                    ))}
                  </div>
                ),
              },
              {
                id: "y",
                title: t("manualMode.dependentGroup"),
                meta: t("explore.carousel.active", { active: activeCount(MANUAL_DV_KEYS), total: MANUAL_DV_KEYS.length }),
                content: (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {byWeight(MANUAL_DV_KEYS).map((key) => (
                      <VariableCard key={key} varKey={key} target={targetDependent[key]} origin={variableProvenance?.[key]} weight={weightOf(key)} />
                    ))}
                  </div>
                ),
              },
            ]}
          />
          <p className="text-center text-sm text-content-muted">{t("controls.profileInspector.zeroVarsNote")}</p>
        </>
      )}
    </div>
  );
}
