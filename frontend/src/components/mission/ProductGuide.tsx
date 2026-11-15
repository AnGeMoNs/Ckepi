import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../../i18n";
import type { PlanetaryBody } from "../../types/analog";
import { Button } from "../ui/Button";

interface Props {
  body: PlanetaryBody;
  totalEvaluated?: number;
  onSelectBody: (body: PlanetaryBody) => void;
  onOpenOutcome: () => void;
}

/** One decision journey for both reading modes; illustration never represents measured data. */
export function ProductGuide({ body, totalEvaluated, onSelectBody, onOpenOutcome }: Props) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <motion.section
      aria-labelledby="product-purpose"
      className="product-guide ckepi-glass rounded-2xl border border-border-subtle p-5 sm:p-7"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-center">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">{t("product.kicker")}</p>
          <h1 id="product-purpose" className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">{t("product.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-content-muted">{t("product.lead")}</p>
          <details className="mt-2 text-xs leading-relaxed text-content-muted"><summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-accent">{t("product.explainAnalysis")}</summary><p>{t("product.scienceScope")}</p></details>
          <ol className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            {(["choose", "discover", "decide"] as const).map((step, index) => (
              <li key={step} className="flex items-start gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono font-bold text-accent">{index + 1}</span>
                <span><strong className="block">{t(`product.${step}Title`)}</strong><span className="mt-1 block text-xs leading-relaxed text-content-muted">{t(`product.${step}Note`)}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-3">
          <LayoutGroup id="product-world-selectors"><div className="grid grid-cols-3 gap-2">
            <div className="product-world rounded-xl p-2 text-center">
              <img src="/img/terrain-art/ckepi-map-atacama.webp" alt="" width={240} height={160} className="aspect-[3/2] w-full object-contain" />
              <span className="text-xs font-semibold">{t("product.earth")}</span>
            </div>
            {(["moon", "mars"] as const).map((world) => (
              <motion.button type="button" key={world} onClick={() => onSelectBody(world)} aria-pressed={body === world} whileHover={reducedMotion ? undefined : { y: -3 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }} className={`product-world relative min-h-11 rounded-xl border-2 p-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${body === world ? "border-accent bg-accent/10" : "border-transparent"}`}>
                {body === world && <motion.span layoutId="world-selection-lens" className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-accent/40" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }} aria-hidden="true" />}
                <img src={`/img/terrain-art/ckepi-map-${world}.webp`} alt="" width={240} height={160} className="aspect-[3/2] w-full object-contain" />
                <span className="text-xs font-semibold">{t(`science.target.${world}`)}</span>
              </motion.button>
            ))}
          </div></LayoutGroup>
          <p className="text-xs leading-relaxed text-content-muted">{t("product.artNotice")}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
            <p className="text-xs font-semibold">{totalEvaluated === undefined ? t("product.loading") : t("product.evaluated", { total: formatNumber(totalEvaluated, i18n.language, 0) })}</p>
            <Button variant="secondary" onClick={onOpenOutcome}>{t("product.outcome")}</Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
