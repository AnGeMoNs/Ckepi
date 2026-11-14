import { useTranslation } from "react-i18next";

/**
 * Software backdrop: the paper-cut "open worlds" illustration (AI-generated, see
 * AI_DISCLOSURE.md) fixed behind the glass panels, under a veil that keeps text contrast.
 * The AI watermark stays visible whenever the illustration is on screen.
 */
export function AppBackdrop() {
  const { t } = useTranslation();
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <picture>
          <source media="(max-width: 767px)" srcSet="/img/backgrounds/ckepi-home-mobile.webp" type="image/webp" />
          <img
            src="/img/backgrounds/ckepi-home-desktop.webp"
            alt=""
            width={2560}
            height={1440}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
        {/* Veil: strong at the top (dense UI), lighter toward the desert at the bottom. */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/90 via-surface/75 to-surface/45" />
      </div>
      <span className="pointer-events-none fixed bottom-3 left-3 z-40 rounded bg-ckepi-space/90 px-2 py-1 text-[11px] font-semibold text-ckepi-salt">
        {t("home.aiImageBadge")}
      </span>
    </>
  );
}
