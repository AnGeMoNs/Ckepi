import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type { TerrainDistributionComparison } from "../../types/analog";
import type { Level, PracticeId } from "../expedition/types";
import { PushButton } from "../ui/PushButton";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";

interface MissionCertificateProps {
  practices: { id: PracticeId; pictogram: PictogramName }[];
  earned: ReadonlySet<string>;
  points: number;
  maxPoints: number;
  /** Reading level the route was completed at, and the next one up (undefined at the top). */
  level: Level;
  nextLevel?: Level;
  /** Real comparison behind the certificate's evidence line (never a typed-in number). */
  terrain: TerrainDistributionComparison;
  onLevelUp: (next: Level) => void;
  onOpenScience: () => void;
  onRestart: () => void;
}

/**
 * Closing certificate — the learner's pass into Science mode. It shows the level completed, the
 * badges, the jobs practised and the real evidence used. The name is typed on screen only (never
 * stored) so a class can print one certificate per student.
 */
export function MissionCertificate({ practices, earned, points, maxPoints, level, nextLevel, terrain, onLevelUp, onOpenScience, onRestart }: MissionCertificateProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [name, setName] = useState("");
  const count = practices.filter((p) => earned.has(p.id)).length;
  // The pass to Science mode is earned by completing every station of the route.
  const passed = count === practices.length;
  const slope = terrain.slope_distribution;
  const fmt = (v: number) => formatNumber(v, i18n.language, 2);

  return (
    <motion.section
      aria-labelledby="mission-certificate-title"
      className="ckepi-liquid ckepi-liquid-glow rounded-[2rem] p-6 text-center sm:p-10"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94, rotate: -1 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
    >
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">{t("steam.certificate.kicker")}</p>
      <h2 id="mission-certificate-title" className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t("steam.certificate.title")}</h2>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 text-sm font-bold ${passed ? "border-status-valid/60 bg-status-valid/15 text-status-valid" : "border-status-warn/60 bg-status-warn/15 text-status-warn"}`}>
          <Pictogram name={passed ? "check" : "decide"} className="h-5 w-5" />
          {passed ? t("steam.certificate.readyBadge") : t("steam.certificate.pending", { n: practices.length - count })}
        </span>
        {passed && <span className="inline-flex min-h-9 items-center rounded-full border border-accent/50 bg-accent/10 px-4 text-sm font-bold text-content">
          {t("steam.certificate.levelDone", { level: t(`expedition.levels.${level}`) })}
        </span>}
      </div>

      <label className="mx-auto mt-5 block max-w-sm text-left text-sm font-semibold text-content-muted">
        {t("steam.certificate.nameLabel")}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("steam.certificate.namePlaceholder")}
          autoComplete="off"
          maxLength={60}
          className="ckepi-liquid mt-1 block min-h-12 w-full rounded-2xl px-4 text-center text-xl font-bold text-content placeholder:text-content-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed">{passed ? t("steam.certificate.text") : t("steam.certificate.pending", { n: practices.length - count })}</p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {practices.map((p, i) => {
          const got = earned.has(p.id);
          return (
            <motion.li
              key={p.id}
              className={`ckepi-liquid flex flex-col items-center gap-2 rounded-3xl p-4 ${got ? "" : "opacity-45"}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12, rotate: -6 }}
              animate={{ opacity: got ? 1 : 0.45, y: 0, rotate: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.15 + i * 0.08, type: "spring", stiffness: 220, damping: 16 }}
            >
              <span className="grid h-14 w-14 place-items-center bg-accent text-ckepi-ink [clip-path:polygon(25%_4%,75%_4%,100%_50%,75%_96%,25%_96%,0%_50%)]">
                <Pictogram name={p.pictogram} className="h-7 w-7" />
              </span>
              <span className="text-base font-bold">{t(`expedition.steps.${p.id}.name`)}</span>
              <span className="text-sm leading-snug text-content-muted">{t(`expedition.steps.${p.id}.job`)}</span>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 font-mono">
        <p><span className="block text-4xl font-semibold tabular-nums">{points}</span><span className="text-sm text-content-muted">{t("steam.certificate.points", { max: maxPoints })}</span></p>
        <p><span className="block text-4xl font-semibold tabular-nums">{count}/{practices.length}</span><span className="text-sm text-content-muted">{t("steam.certificate.badges")}</span></p>
      </div>

      {/* The evidence the learner worked with, read from the same real snapshot as the practices. */}
      <p className="mx-auto mt-5 max-w-3xl rounded-2xl border border-border-subtle/50 bg-surface/30 px-4 py-3 font-mono text-sm leading-relaxed text-content-muted">
        {t("steam.certificate.verifiedSummary", {
          w1: fmt(slope.wasserstein_distance),
          lo: fmt(slope.w1_ci_95[0]),
          hi: fmt(slope.w1_ci_95[1]),
          yungay: fmt(slope.control_yungay_w1),
        })}
      </p>

      {/* The pass: one level up while there is one, then the door to Science mode. */}
      {passed && <div className="ckepi-liquid mx-auto mt-6 flex max-w-3xl flex-col items-center gap-4 rounded-3xl p-5 print:hidden sm:flex-row sm:text-left">
        <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
          <Pictogram name="research" className="h-8 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-content">{nextLevel ? t("steam.certificate.levelUpTitle") : t("steam.certificate.openScience")}</p>
          <p className="mt-0.5 text-base leading-snug text-content-muted">{nextLevel ? t("steam.certificate.levelUpHint") : t("steam.certificate.openScienceHint")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
          {nextLevel && (
            <PushButton tone="copper" onClick={() => onLevelUp(nextLevel)}>
              <Pictogram name="rover" className="h-5 w-5" />
              {t("steam.certificate.levelUp", { level: t(`expedition.levels.${nextLevel}`) })}
            </PushButton>
          )}
          <PushButton tone={nextLevel ? "ink" : "copper"} onClick={onOpenScience}>
            <Pictogram name="globe" className="h-5 w-5" />
            {t("steam.certificate.openScience")}
          </PushButton>
        </div>
      </div>}

      <p className="mx-auto mt-4 max-w-2xl text-sm text-content-muted">{t("expedition.preselection")}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 print:hidden">
        <PushButton tone="salt" disabled={!passed} onClick={() => window.print()}>
          <Pictogram name="download" className="h-5 w-5" />
          {t("steam.certificate.print")}
        </PushButton>
        <PushButton tone="ink" onClick={onRestart}>
          <Pictogram name="replay" className="h-5 w-5" />
          {t("steam.certificate.again")}
        </PushButton>
      </div>
    </motion.section>
  );
}
