import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Globe2,
  GraduationCap,
  HelpCircle,
  MapPin,
  Network,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type { SiteComparisonResponse } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface LaAraucanaImpactPanelProps {
  comparison: SiteComparisonResponse | null;
  selectedH3: string | null;
  onSelectAntofagastaCell: (h3Index: string, siteId?: string) => void;
}

const ANTOFAGASTA_NODES = [
  {
    h3: "83b221fffffffff",
    labelKey: "regions.antofagasta_salar_pajonales",
    roleKey: "araucana.nodes.pajonalesRole",
    isDiscovery: true,
  },
  {
    h3: "83b225fffffffff",
    labelKey: "regions.antofagasta_cordillera_sal",
    roleKey: "araucana.nodes.cordilleraRole",
    isDiscovery: true,
  },
  {
    h3: "83b224fffffffff",
    labelKey: "regions.antofagasta_pampa_central",
    roleKey: "araucana.nodes.pampaRole",
    isDiscovery: true,
  },
  {
    h3: "83b220fffffffff",
    labelKey: "regions.atacama_yungay",
    roleKey: "araucana.nodes.yungayRole",
    isDiscovery: false,
  },
] as const;

export function LaAraucanaImpactPanel({
  comparison,
  selectedH3,
  onSelectAntofagastaCell,
}: LaAraucanaImpactPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [literacyLevel, setLiteracyLevel] = useState<1 | 2 | 3>(1);
  const [quizChoice, setQuizChoice] = useState<"pajonales" | "yungay" | "amazon" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const earthSite = comparison ? t(comparison.match.region_key) : t("regions.antofagasta_salar_pajonales");
    const targetSite = comparison ? t(comparison.site.name_key) : t("sites.mars_jezero_crater.name");
    const w1Slope = comparison?.statistical_distribution
      ? formatNumber(comparison.statistical_distribution.slope_distribution.wasserstein_distance, lang, 2)
      : formatNumber(0.77, lang, 2);

    const speechText = t("threeWorlds.speechScript", {
      earthSite,
      targetSite,
      w1Slope,
    });

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang.startsWith("pt") ? "pt-BR" : lang.startsWith("en") ? "en-US" : "es-CL";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent" aria-hidden="true" />
          <CardTitle>{t("araucana.title")}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="valid">{t("araucana.badgeLocal")}</Badge>
          <Badge variant="accent">{t("araucana.badgeOds")}</Badge>
          <Button variant="secondary" onClick={handleToggleSpeech}>
            {isSpeaking ? (
              <VolumeX className="h-4 w-4 text-status-break" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4 text-accent" aria-hidden="true" />
            )}
            <span>
              {isSpeaking ? t("threeWorlds.stopVoice") : t("threeWorlds.listenVoice")}
            </span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section 1: Antofagasta Natural Laboratory One-Tap Quick Switcher */}
        <div className="rounded border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-accent">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("araucana.antofagastaLabTitle")}
              </h3>
              <p className="text-xs text-content-muted">{t("araucana.antofagastaLabSubtitle")}</p>
            </div>
            <Badge variant="default">{t("araucana.utmScaleBadge")}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {ANTOFAGASTA_NODES.map((node) => {
              const isSelected = selectedH3 === node.h3;
              return (
                <button
                  key={node.h3}
                  type="button"
                  onClick={() => onSelectAntofagastaCell(node.h3, "mars_jezero_crater")}
                  className={`flex min-h-11 flex-col justify-between rounded border p-3 text-left transition ${
                    isSelected
                      ? "border-accent bg-surface-elevated ring-1 ring-accent"
                      : "border-border-subtle bg-surface hover:border-accent/60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <Badge variant={node.isDiscovery ? "valid" : "default"}>
                        {node.isDiscovery ? t("map.discoveryBadge") : t("map.benchmarkBadge")}
                      </Badge>
                      <code className="font-mono text-[10px] text-content-muted">
                        {node.h3.slice(0, 7)}…
                      </code>
                    </div>
                    <p className="text-xs font-bold text-content">{t(node.labelKey)}</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-content-muted">
                    {t(node.roleKey)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: "Tres Mundos en tu Mano" (Earth · Moon · Mars) Progressive STEAM Module */}
        <div className="rounded border border-border-subtle bg-surface p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
                <Globe2 className="h-4 w-4 text-accent" aria-hidden="true" />
                {t("threeWorlds.title")}
              </h3>
              <p className="text-xs text-content-muted">{t("threeWorlds.subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {([1, 2, 3] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLiteracyLevel(lvl)}
                  className={`min-h-11 rounded border px-3 py-1 text-xs font-medium transition ${
                    literacyLevel === lvl
                      ? "border-accent bg-accent text-white"
                      : "border-border-subtle bg-surface-elevated text-content-muted hover:text-content"
                  }`}
                >
                  {t(`threeWorlds.levels.level${lvl}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Worlds Verified NASA Fact Sheet Cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* EARTH */}
            <div className="rounded border border-status-valid/50 bg-surface-elevated p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-content">{t("threeWorlds.earth.name")}</span>
                <Badge variant="valid">1,00 g · 1013 mbar</Badge>
              </div>
              <p className="text-xs text-content-muted">{t("threeWorlds.earth.summary")}</p>
              <ul className="space-y-1 border-t border-border-subtle pt-2 text-xs text-content">
                <li>• {t("threeWorlds.earth.backpack")}</li>
                <li>• {t("threeWorlds.earth.air")}</li>
                {literacyLevel >= 2 && <li>• {t("threeWorlds.earth.dayAndTemp")}</li>}
                {literacyLevel >= 3 && <li>• {t("threeWorlds.earth.radiation")}</li>}
              </ul>
            </div>

            {/* MOON */}
            <div className="rounded border border-planet-moon/50 bg-surface-elevated p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-content">{t("threeWorlds.moon.name")}</span>
                <Badge variant="moon">0,166 g · 0 mbar</Badge>
              </div>
              <p className="text-xs text-content-muted">{t("threeWorlds.moon.summary")}</p>
              <ul className="space-y-1 border-t border-border-subtle pt-2 text-xs text-content">
                <li>• {t("threeWorlds.moon.backpack")}</li>
                <li>• {t("threeWorlds.moon.air")}</li>
                {literacyLevel >= 2 && <li>• {t("threeWorlds.moon.dayAndTemp")}</li>}
                {literacyLevel >= 3 && <li>• {t("threeWorlds.moon.radiation")}</li>}
              </ul>
            </div>

            {/* MARS */}
            <div className="rounded border border-planet-mars/50 bg-surface-elevated p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-content">{t("threeWorlds.mars.name")}</span>
                <Badge variant="mars">0,38 g · 6,1 mbar</Badge>
              </div>
              <p className="text-xs text-content-muted">{t("threeWorlds.mars.summary")}</p>
              <ul className="space-y-1 border-t border-border-subtle pt-2 text-xs text-content">
                <li>• {t("threeWorlds.mars.backpack")}</li>
                <li>• {t("threeWorlds.mars.air")}</li>
                {literacyLevel >= 2 && <li>• {t("threeWorlds.mars.dayAndTemp")}</li>}
                {literacyLevel >= 3 && <li>• {t("threeWorlds.mars.radiation")}</li>}
              </ul>
            </div>
          </div>

          {/* Interactive STEAM Micro-Challenge */}
          <div className="rounded border border-border-subtle bg-surface-elevated p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-content sm:text-sm">
                <HelpCircle className="h-4 w-4 text-accent" aria-hidden="true" />
                {t("threeWorlds.quiz.question")}
              </p>
              <span className="text-[11px] text-content-muted">
                {t("threeWorlds.quiz.sourceNote")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["pajonales", "yungay", "amazon"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setQuizChoice(opt);
                    if (opt === "pajonales") {
                      onSelectAntofagastaCell("83b221fffffffff", "mars_jezero_crater");
                    } else if (opt === "yungay") {
                      onSelectAntofagastaCell("83b220fffffffff", "mars_jezero_crater");
                    }
                  }}
                  className={`min-h-11 rounded border px-3 py-2 text-left text-xs font-medium transition ${
                    quizChoice === opt
                      ? "border-accent bg-accent/10 text-content"
                      : "border-border-subtle bg-surface text-content-muted hover:text-content"
                  }`}
                >
                  {t(`threeWorlds.quiz.options.${opt}`)}
                </button>
              ))}
            </div>

            {quizChoice && (
              <div className="rounded border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed text-content">
                {t(`threeWorlds.quiz.feedback.${quizChoice}`)}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Caja La Araucana 4 Official Objectives & Verified UN SDGs */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
              <Award className="h-4 w-4 text-accent" aria-hidden="true" />
              {t("araucana.pillarsTitle")}
            </h3>
            <span className="text-xs text-content-muted">{t("araucana.pillarsSubtitle")}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-border-subtle bg-surface p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
                <Badge variant="accent">ODS 4.3 · 4.4</Badge>
              </div>
              <h4 className="text-xs font-bold text-content">{t("araucana.pillars.p1Title")}</h4>
              <p className="text-xs leading-relaxed text-content-muted">
                {t("araucana.pillars.p1Body")}
              </p>
            </div>

            <div className="rounded border border-border-subtle bg-surface p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <Sparkles className="h-4 w-4 text-status-valid" aria-hidden="true" />
                <Badge variant="valid">ODS 4.4 · 8</Badge>
              </div>
              <h4 className="text-xs font-bold text-content">{t("araucana.pillars.p2Title")}</h4>
              <p className="text-xs leading-relaxed text-content-muted">
                {t("araucana.pillars.p2Body")}
              </p>
            </div>

            <div className="rounded border border-border-subtle bg-surface p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <Compass className="h-4 w-4 text-status-warn" aria-hidden="true" />
                <Badge variant="warn">ODS 9.5 · 10</Badge>
              </div>
              <h4 className="text-xs font-bold text-content">{t("araucana.pillars.p3Title")}</h4>
              <p className="text-xs leading-relaxed text-content-muted">
                {t("araucana.pillars.p3Body")}
              </p>
            </div>

            <div className="rounded border border-border-subtle bg-surface p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <Network className="h-4 w-4 text-accent" aria-hidden="true" />
                <Badge variant="default">ODS 17.3 · 17.16 · 17.17</Badge>
              </div>
              <h4 className="text-xs font-bold text-content">{t("araucana.pillars.p4Title")}</h4>
              <p className="text-xs leading-relaxed text-content-muted">
                {t("araucana.pillars.p4Body")}
              </p>
            </div>
          </div>

          {/* Sustainability & Interregional Lattice Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
            <span className="flex items-center gap-1.5 font-medium text-content">
              <CheckCircle2 className="h-4 w-4 text-status-valid" aria-hidden="true" />
              {t("araucana.sustainabilityTitle")}
            </span>
            <span>{t("araucana.sustainabilityBody")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
