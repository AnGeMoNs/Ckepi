import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { TestProfileType } from "../../types/analog";

/** Each test type wears one of Ckepi's cardboard illustrations (same family as the home portals). */
const PROFILES: { id: TestProfileType; art: string }[] = [
  { id: "causal_auto", art: "/img/planets/ckepi-planet-science.webp" },
  { id: "navigation_landing", art: "/img/science-accessories/ckepi-icon-relief.webp" },
  { id: "rover_mobility", art: "/img/science-accessories/ckepi-icon-slope.webp" },
  { id: "isru_ice_drilling", art: "/img/science-accessories/ckepi-icon-water.webp" },
  { id: "lava_tube_habitat", art: "/img/science-accessories/ckepi-icon-soil.webp" },
  { id: "solar_power_thermal", art: "/img/science-accessories/ckepi-icon-solar.webp" },
  { id: "manual_custom", art: "/img/science-accessories/ckepi-icon-temperature.webp" },
];

interface ProfilePickerProps {
  value: TestProfileType;
  onChange: (profile: TestProfileType) => void;
}

/**
 * Test types as liquid-glass tiles: a cardboard illustration that lifts when chosen, one word and
 * a plain hint. The glowing lens glides between tiles so the choice is felt, not just read.
 */
export function ProfilePicker({ value, onChange }: ProfilePickerProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <LayoutGroup id="mission-profile">
      <div role="group" aria-label={t("explore.mission.profiles")} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7">
        {PROFILES.map(({ id, art }, index) => {
          const active = id === value;
          return (
            <motion.button
              key={id}
              type="button"
              aria-pressed={active}
              title={t(`controls.profiles.${id}`)}
              onClick={() => onChange(id)}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22, delay: reduceMotion ? 0 : index * 0.04 }}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className={`group relative flex min-h-[9.5rem] flex-col items-center justify-start gap-1 rounded-3xl px-3 pb-3 pt-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? "" : "ckepi-liquid"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="mission-profile-lens"
                  aria-hidden="true"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 30 }}
                  className="ckepi-liquid ckepi-liquid-glow absolute inset-0 rounded-3xl border-accent/60"
                />
              )}
              <motion.img
                src={art}
                alt=""
                width={96}
                height={96}
                draggable={false}
                className="relative h-14 w-14 object-contain drop-shadow-ckepi-logo sm:h-16 sm:w-16"
                animate={reduceMotion ? undefined : { y: active ? -4 : 0, scale: active ? 1.1 : 0.92, rotate: active ? -3 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              />
              <span className="relative text-base font-bold text-content">{t(`explore.profiles.${id}.title`)}</span>
              <span className="relative text-xs leading-snug text-content-muted sm:text-sm">{t(`explore.profiles.${id}.hint`)}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
