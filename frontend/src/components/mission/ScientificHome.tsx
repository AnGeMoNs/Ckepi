import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { PlanetaryBody } from "../../types/analog";
import { AiSeal } from "../ui/AiSeal";

interface Props {
  body: PlanetaryBody;
  evaluated?: number;
  onChoose: (body: PlanetaryBody) => void;
  onEarth: () => void;
}

/** Earth is the test site; choosing a planetary destination opens the actual search workspace. */
export function ScientificHome({ body, onChoose, onEarth }: Props) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <section aria-labelledby="scientific-home-title" className="scientific-home relative isolate overflow-hidden rounded-3xl px-5 py-8 sm:px-9 sm:py-10">
      {/* Lettering on the left, centred inside its own column (not glued to the edge); destinations on the right. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="flex w-full justify-center">
          {/* Spanish: cardboard lettering (AI image, transparent) over the real heading text, which stays for screen readers and the other languages. */}
          <h1 id="scientific-home-title" className="w-full text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            <span className={i18n.language.startsWith("es") ? "sr-only" : ""}>{t("scientificHome.title")}</span>
            {i18n.language.startsWith("es") && (
              <span className="relative mx-auto block w-full max-w-[19rem] sm:max-w-sm lg:max-w-md">
                <img src="/img/controls/ckepi-scientific-title-es-v2.webp" alt="" width={1200} height={995} decoding="async" className="block h-auto w-full" />
                <AiSeal className="absolute bottom-0 right-0" />
              </span>
            )}
          </h1>
        </div>
        <div className="scientific-worlds relative grid w-full grid-cols-3 gap-2 sm:gap-4">
          <motion.button type="button" onClick={onEarth} whileHover={reducedMotion ? undefined : { y: -6, rotate: -1 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 24 }} className="scientific-destination relative rounded-2xl border-2 border-border-subtle/50 p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-3">
            <img src="/img/terrain-art/ckepi-map-atacama.webp" alt="" width={320} height={210} className="h-24 w-full object-contain sm:h-36" />
            <span className="mt-3 block text-sm font-bold">{t("scientificHome.choose", { body: t("scientificHome.earth") })}</span>
            <span className="mt-1 block text-xs text-content-muted">{t("product.earth")}</span>
          </motion.button>
          {(["moon", "mars"] as const).map((world) => <motion.button key={world} type="button" onClick={() => onChoose(world)} whileHover={reducedMotion ? undefined : { y: -6, rotate: world === "moon" ? -1 : 1 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 24 }} className={`scientific-destination relative rounded-2xl border-2 p-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${body === world ? "border-accent" : "border-border-subtle/50"}`}>
            <img src={`/img/terrain-art/ckepi-map-${world}.webp`} alt="" width={320} height={210} className="h-24 w-full object-contain sm:h-36" />
            <span className="mt-3 block text-sm font-bold">{t("scientificHome.choose", { body: t(`bodies.${world}`) })}</span>
            <span className="mt-1 block text-xs text-content-muted">{t(`science.target.${world}`)}</span>
          </motion.button>)}
        </div>
      </div>
    </section>
  );
}
