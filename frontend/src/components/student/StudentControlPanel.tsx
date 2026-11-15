import {
  Compass,
  Droplets,
  Globe2,
  Moon,
  Mountain,
  Rocket,
  Sparkles,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  PlanetaryBody,
  PlanetarySite,
  TestProfileType,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";
import { Select } from "../ui/Select";

interface StudentControlPanelProps {
  sites: PlanetarySite[];
  selectedBody: PlanetaryBody;
  selectedSiteId: string;
  customProbedSite: PlanetarySite | null;
  activeSite?: PlanetarySite;
  testProfile: TestProfileType;
  onSelectBody: (body: PlanetaryBody) => void;
  onSelectSite: (siteId: string, body?: PlanetaryBody) => void;
  onChangeTestProfile: (profile: TestProfileType) => void;
}

const STUDENT_GOALS: Array<{
  id: Exclude<TestProfileType, "manual_custom">;
  icon: typeof Sparkles;
}> = [
  { id: "causal_auto", icon: Sparkles },
  { id: "rover_mobility", icon: Compass },
  { id: "solar_power_thermal", icon: Sun },
  { id: "isru_ice_drilling", icon: Droplets },
  { id: "lava_tube_habitat", icon: Mountain },
  { id: "navigation_landing", icon: Rocket },
];

export function StudentControlPanel({
  sites,
  selectedBody,
  selectedSiteId,
  customProbedSite,
  activeSite,
  testProfile,
  onSelectBody,
  onSelectSite,
  onChangeTestProfile,
}: StudentControlPanelProps) {
  const { t } = useTranslation();

  const bodySites = sites.filter((s) => s.body === selectedBody);
  const customMatchesBody =
    customProbedSite !== null && customProbedSite.body === selectedBody;

  const siteOptions = [
    ...(customMatchesBody && customProbedSite
      ? [
          {
            value: customProbedSite.site_id,
            label: `${t(`bodies.${customProbedSite.body}`)}: ${t(
              customProbedSite.name_key
            )} (${customProbedSite.coordinates.lat.toFixed(1)}°, ${customProbedSite.coordinates.lon.toFixed(1)}°)`,
          },
        ]
      : []),
    ...bodySites.map((s) => ({
      value: s.site_id,
      label: t(s.name_key),
    })),
  ];

  const activeGoal = testProfile === "manual_custom" ? "causal_auto" : testProfile;

  return (
    <Card>
      <CardContent className="space-y-5 py-4">
        {/* Step 1: Choose Planet & Site */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="space-y-2 lg:col-span-5">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent">
              {t("studentControls.step1Label")}
            </span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("studentControls.chooseWorld")}>
              <button
                type="button"
                onClick={() => onSelectBody("moon")}
                aria-pressed={selectedBody === "moon"}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selectedBody === "moon"
                    ? "border-accent bg-accent text-accent-foreground shadow-sm"
                    : "border-border-subtle bg-surface text-content hover:bg-surface-muted"
                }`}
              >
                <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("bodies.moon")}</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectBody("mars")}
                aria-pressed={selectedBody === "mars"}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selectedBody === "mars"
                    ? "border-accent bg-accent text-accent-foreground shadow-sm"
                    : "border-border-subtle bg-surface text-content hover:bg-surface-muted"
                }`}
              >
                <Globe2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("bodies.mars")}</span>
              </button>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <Select
              id="student-target-site"
              label={t("studentControls.choosePlace")}
              value={selectedSiteId}
              options={siteOptions}
              onChange={(e) => {
                const nextId = e.target.value;
                const found =
                  customProbedSite?.site_id === nextId
                    ? customProbedSite
                    : sites.find((s) => s.site_id === nextId);
                onSelectSite(nextId, found?.body);
              }}
            />
          </div>
        </div>

        {activeSite && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-xs text-content-muted">
            <p className="leading-relaxed">
              <strong className="text-content">{t(activeSite.name_key)}:</strong>{" "}
              {t(activeSite.mission_context_key)}
            </p>
            <Badge variant={selectedBody === "mars" ? "mars" : "moon"}>
              {t(`bodies.${selectedBody}`)}
            </Badge>
          </div>
        )}

        {/* Step 2: Choose Comparison Focus in Plain Language */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("studentControls.step2Label")}
            </span>
            <span className="text-xs text-content-muted">{t("studentControls.step2Hint")}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STUDENT_GOALS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = activeGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => onChangeTestProfile(goal.id)}
                  aria-pressed={isSelected}
                  className={`flex min-h-11 items-start gap-2.5 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? "border-accent bg-accent/10 text-content ring-1 ring-accent/40"
                      : "border-border-subtle bg-surface text-content-muted hover:border-accent/50 hover:text-content"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      isSelected ? "text-accent" : "text-content-muted"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-content">
                      {t(`studentControls.goals.${goal.id}.title`)}
                    </p>
                    <p className="text-[11px] leading-snug text-content-muted">
                      {t(`studentControls.goals.${goal.id}.desc`)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
