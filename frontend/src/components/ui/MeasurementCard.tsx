import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";

import { Pictogram } from "../worlds/Pictograms";
import { ParamIcon, type ParamIconName } from "./ParamIcon";

interface MeasurementCardProps {
  label: string;
  value: string;
  unit: string;
  icon: ParamIconName;
  context: string;
  detail: string;
  active: boolean;
  onSelect: () => void;
  tone?: "candidate" | "reference" | "limit";
  artwork?: string;
  chart?: ReactNode;
}

/** A measurement stays readable; the glass lens and illustration respond to selection. */
export function MeasurementCard({ label, value, unit, icon, context, detail, active, onSelect, tone = "reference", artwork, chart }: MeasurementCardProps) {
  const reducedMotion = useReducedMotion();
  const detailId = useId();
  return (
    <motion.button
      type="button"
      className={`ckepi-liquid measurement-${tone} min-h-11 min-w-0 rounded-3xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-5 ${active ? "ckepi-liquid-glow" : ""}`}
      aria-label={label}
      aria-expanded={active}
      aria-controls={active ? detailId : undefined}
      onClick={onSelect}
      whileHover={reducedMotion ? undefined : { y: -3 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <span className="relative block">
        {artwork && <span className="mb-4 block overflow-hidden rounded-2xl border border-border-subtle/40 bg-surface/30"><AnimatePresence initial={false} mode="wait"><motion.span key={active ? "data" : "art"} className="block" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>{active && chart ? chart : <img src={artwork} alt="" width={400} height={220} className="h-40 w-full object-contain" />}</motion.span></AnimatePresence></span>}
        <span className="flex items-start justify-between gap-3">
          <motion.span className="relative inline-flex shrink-0 items-center justify-center rounded-2xl p-1" animate={reducedMotion ? undefined : { rotate: active ? -5 : 0, scale: active ? 1.07 : 1 }} transition={{ type: "spring", stiffness: 320, damping: 22 }}>
            <ParamIcon name={icon} className="h-14 w-14 drop-shadow-ckepi-logo" />
            <span className="absolute -bottom-1 -right-2 rounded-full border border-border-subtle/60 bg-surface/80 px-2 py-0.5 font-mono text-xs font-bold text-accent">{unit}</span>
          </motion.span>
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border-subtle/60 text-accent"><Pictogram name="chevronDown" className={`h-5 w-5 transition-transform ${active ? "rotate-180" : ""}`} /></span>
        </span>
        <span className="mt-4 block text-base font-bold leading-snug text-content">{label}</span>
        <span className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <motion.span key={value} className="max-w-full break-words font-mono text-2xl font-bold leading-none tabular-nums text-content sm:text-3xl" initial={reducedMotion ? false : { opacity: 0.6, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>{value}</motion.span>
          <span className="font-mono text-sm font-semibold text-content-muted">{unit}</span>
        </span>
        <span className="mt-3 block text-sm leading-relaxed text-content-muted">{context}</span>
        <AnimatePresence initial={false}>
          {active && <motion.span id={detailId} className="block overflow-hidden" initial={reducedMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reducedMotion ? undefined : { height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}><span className="mt-4 block border-t border-border-subtle/50 pt-3 text-sm leading-relaxed text-content">{detail}</span></motion.span>}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
