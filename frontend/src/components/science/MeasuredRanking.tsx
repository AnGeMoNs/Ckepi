import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { MeasuredCell } from "./measuredCells";

interface MeasuredRankingProps {
  cells: MeasuredCell[];
  selected: string;
  onSelect: (h3: string) => void;
  format: (value: number, digits?: number) => string;
}

/** Short ranking: one bar per cell (W₁, shorter = closer) with the classic Yungay marked as a line. */
export function MeasuredRanking({ cells, selected, onSelect, format }: MeasuredRankingProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const yungay = cells[0]?.yungayW1Deg ?? 0;
  const max = Math.max(...cells.map((c) => c.w1CiDeg[1]), yungay) * 1.05;

  return (
    <section aria-labelledby="ranking-title" className="flex flex-col gap-3">
      <h2 id="ranking-title" className="text-xl font-bold sm:text-2xl">
        {t("science.ranking.title")}
      </h2>
      <p className="text-sm text-content-muted">{t("science.ranking.lead")}</p>
      <ol className="flex flex-col gap-2">
        {cells.map((cell, i) => {
          const active = cell.h3 === selected;
          return (
            <li key={cell.h3}>
              <button
                type="button"
                onClick={() => onSelect(cell.h3)}
                aria-pressed={active}
                className={`grid min-h-14 w-full grid-cols-[2rem_1fr] items-center gap-3 rounded-2xl px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[2rem_11rem_1fr_6rem] ${
                  active ? "ckepi-paper-card-salt" : "ckepi-paper-card"
                }`}
              >
                <span className="font-mono text-lg font-bold">{i + 1}</span>
                <span className="font-mono text-sm font-semibold">{cell.h3}</span>
                {/* Bar: W₁ with its 95 % CI; vertical line = classic Yungay. */}
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="col-span-2 h-5 w-full sm:col-span-1" aria-hidden="true">
                  <rect x="0" y="8" width="100" height="4" rx="2" className="fill-black/20" />
                  <rect x={(cell.w1CiDeg[0] / max) * 100} y="6" width={((cell.w1CiDeg[1] - cell.w1CiDeg[0]) / max) * 100} height="8" className="fill-current opacity-30" />
                  <motion.rect
                    x="0"
                    y="4"
                    height="12"
                    rx="3"
                    className={cell.w1Deg < yungay ? "fill-ckepi-copper" : "fill-planet-mars"}
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: (cell.w1Deg / max) * 100 }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  />
                  <rect x={(yungay / max) * 100} y="0" width="0.8" height="20" className="fill-ckepi-salt" />
                </svg>
                <span className="col-span-2 font-mono text-sm tabular-nums sm:col-span-1 sm:text-right">
                  {format(cell.w1Deg)}° <span className="text-content-muted">[{format(cell.w1CiDeg[0])}–{format(cell.w1CiDeg[1])}]</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-content-muted">{t("science.ranking.legend", { w1: format(yungay) })}</p>
    </section>
  );
}
