import { useTranslation } from "react-i18next";

interface Props { target: "mars" | "moon"; onTargetChange: (target: "mars" | "moon") => void }

/** Illustrative world selectors; geographic positions always belong to the measured map below. */
export function WorldTerrainStrip({ target, onTargetChange }: Props) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="terrain-worlds-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="terrain-worlds-title" className="text-lg font-bold">{t("dashboard.visualWorlds")}</h2><p className="text-xs text-content-muted">{t("dashboard.visualNotice")}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="dashboard-world-card dashboard-world-earth">
          <img src="/img/terrain-art/ckepi-map-atacama.webp" alt="" width={1536} height={1024} decoding="async" className="aspect-[3/2] w-full object-contain" />
          <div className="flex items-center gap-3 px-4 pb-4"><img src="/img/planets/ckepi-planet-earth.webp" alt="" width={56} height={56} className="h-14 w-14 object-contain" /><div><p className="text-xs font-semibold text-accent">{t("dashboard.earthRole")}</p><h3 className="font-bold">{t("dashboard.earthTerrain")}</h3></div></div>
        </article>
        {(["mars", "moon"] as const).map((world) => <button type="button" key={world} onClick={() => onTargetChange(world)} aria-label={t(`science.target.${world}`)} aria-pressed={target === world} className={`dashboard-world-card text-left ${target === world ? "dashboard-world-active" : ""}`}>
          <img src={`/img/terrain-art/ckepi-map-${world}.webp`} alt="" width={1536} height={1024} decoding="async" className="aspect-[3/2] w-full object-contain" />
          <span className="flex items-center gap-3 px-4 pb-4"><img src={`/img/planets/ckepi-planet-${world}.webp`} alt="" width={56} height={56} className="h-14 w-14 object-contain" /><span><span className="block text-xs font-semibold text-accent">{t(target === world ? "dashboard.activeTarget" : "dashboard.chooseTarget")}</span><span className="block font-bold">{t(`science.target.${world}`)}</span></span></span>
        </button>)}
      </div>
    </section>
  );
}
