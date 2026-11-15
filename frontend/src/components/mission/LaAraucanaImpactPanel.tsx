import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  AnalogMatchItem,
  PlanetaryBody,
  PlanetarySite,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Pictogram } from "../worlds/Pictograms";

interface LaAraucanaImpactPanelProps {
  body: PlanetaryBody;
  site?: PlanetarySite;
  topAnalogs: AnalogMatchItem[];
  onSelectCell?: (cell: AnalogMatchItem) => void;
  onOpenLearn?: () => void;
}

export function LaAraucanaImpactPanel({
  body,
  site,
  topAnalogs,
  onSelectCell,
  onOpenLearn,
}: LaAraucanaImpactPanelProps) {
  const { t, i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const chileAnalogs = topAnalogs.filter((a) => a.country_code === "CL");
  const latamAndGlobalAnalogs = topAnalogs.slice(0, 6);

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const speechText = [
      t("araucana.title"),
      t("araucana.subtitle"),
      t("araucana.pillar1.title"),
      t("araucana.pillar1.desc"),
      t("araucana.pillar2.title"),
      t("araucana.pillar2.desc"),
      t("araucana.pillar3.title"),
      t("araucana.pillar3.desc"),
      t("araucana.pillar4.title"),
      t("araucana.pillar4.desc"),
    ].join(". ");

    const utterance = new SpeechSynthesisUtterance(speechText);
    const lang = i18n.language || "es";
    utterance.lang = lang.startsWith("pt")
      ? "pt-BR"
      : lang.startsWith("en")
        ? "en-US"
        : "es-CL";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const inquiryQuestions = ["q1", "q2", "q3"] as const;
  const steamRoles = ["geomatics", "astrobiology", "robotics", "dataScience"] as const;
  const sdgs = ["sdg4", "sdg8", "sdg9", "sdg13", "sdg17"] as const;

  return (
    <Card className="ckepi-liquid border-accent/40">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pictogram name="decide" className="h-5 w-5 text-accent" />
            <CardTitle>{t("araucana.title")}</CardTitle>
            <Badge variant="valid">{t("araucana.badge")}</Badge>
          </div>
          <p className="text-xs text-content-muted">{t("araucana.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {typeof window !== "undefined" && "speechSynthesis" in window && (
            <Button
              variant="secondary"
              onClick={handleToggleSpeech}
              aria-pressed={speaking}
            >
              <Pictogram name="listen" className="h-4 w-4 text-accent" />
              <span>
                {speaking
                  ? t("araucana.stopVoice")
                  : t("araucana.listenVoice")}
              </span>
            </Button>
          )}
          {onOpenLearn && (
            <Button variant="primary" onClick={onOpenLearn}>
              <Pictogram name="observe" className="h-4 w-4" />
              <span>{t("araucana.openSteamLab")}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Pillar 1: Frontier Science & Methodology */}
          <div className="ckepi-steam-card rounded-xl p-3.5">
            <div className="flex items-center gap-2">
              <Pictogram name="compare" className="h-5 w-5 text-accent" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-content">
                {t("araucana.pillar1.title")}
              </h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-content-muted">
              {t("araucana.pillar1.desc")}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge variant="accent">X → Y ∥ B</Badge>
              <Badge variant="default">H3 Res. 6 (~36 km²) + DEM 30 m</Badge>
              <Badge variant="valid">Wasserstein-1 + Bootstrap 2D</Badge>
            </div>
          </div>

          {/* Pillar 2: STEAM & Future Employability */}
          <div className="ckepi-steam-card rounded-xl p-3.5">
            <div className="flex items-center gap-2">
              <Pictogram name="observe" className="h-5 w-5 text-accent" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-content">
                {t("araucana.pillar2.title")}
              </h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-content-muted">
              {t("araucana.pillar2.desc")}
            </p>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {steamRoles.map((role) => (
                <li
                  key={role}
                  className="flex items-start gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-[11px]"
                >
                  <Pictogram
                    name="check"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-valid"
                  />
                  <div>
                    <strong className="block text-content">
                      {t(`araucana.pillar2.roles.${role}.title`)}
                    </strong>
                    <span className="text-content-muted">
                      {t(`araucana.pillar2.roles.${role}.skill`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pillar 3: Local Application — Antofagasta Natural Laboratory */}
          <div className="ckepi-steam-card rounded-xl p-3.5">
            <div className="flex items-center gap-2">
              <Pictogram name="globe" className="h-5 w-5 text-accent" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-content">
                {t("araucana.pillar3.title")}
              </h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-content-muted">
              {t("araucana.pillar3.desc", {
                target: site ? t(site.name_key) : t(`bodies.${body}`),
              })}
            </p>
            {chileAnalogs.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {chileAnalogs.slice(0, 4).map((cell) => (
                  <button
                    key={cell.earth_cell_h3}
                    type="button"
                    onClick={() => onSelectCell?.(cell)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-content transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Pictogram name="globe" className="h-3.5 w-3.5 text-accent" />
                    <span>{t(cell.region_key)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pillar 4: Interregional Network & UN SDGs */}
          <div className="ckepi-steam-card rounded-xl p-3.5">
            <div className="flex items-center gap-2">
              <Pictogram name="rover" className="h-5 w-5 text-accent" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-content">
                {t("araucana.pillar4.title")}
              </h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-content-muted">
              {t("araucana.pillar4.desc")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sdgs.map((sdg) => (
                <Badge key={sdg} variant="default">
                  {t(`araucana.pillar4.sdgs.${sdg}`)}
                </Badge>
              ))}
            </div>
            {latamAndGlobalAnalogs.length > 0 && (
              <p className="mt-2 text-[11px] text-content-muted">
                <strong className="text-content">
                  {t("araucana.pillar4.networkNodesLabel")}:
                </strong>{" "}
                {latamAndGlobalAnalogs
                  .map((a) => `${t(a.region_key)} (${a.country_code})`)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Guided Classroom / Outreach Inquiry Sheet */}
        <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-content">
              <Pictogram name="observe" className="h-4 w-4 text-accent" />
              {t("araucana.inquiry.title")}
            </h4>
            <span className="text-[11px] text-content-muted">
              {t("araucana.inquiry.subtitle")}
            </span>
          </div>
          <ol className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {inquiryQuestions.map((qKey, idx) => (
              <li
                key={qKey}
                className="ckepi-steam-card rounded-lg p-2.5 text-xs"
              >
                <p className="font-semibold text-content">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                    {idx + 1}
                  </span>
                  {t(`araucana.inquiry.${qKey}.question`)}
                </p>
                <p className="mt-1 flex items-start gap-1 text-[11px] text-content-muted">
                  <Pictogram
                    name="decide"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                  />
                  <span>{t(`araucana.inquiry.${qKey}.guide`)}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
