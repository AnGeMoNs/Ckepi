import { useTranslation } from "react-i18next";

import { CardboardButton } from "../ui/CardboardButton";

interface UnitToggleProps<U extends string> {
  units: readonly U[];
  value: U;
  onChange: (unit: U) => void;
}

/** Switch between units of measure: the same quantity, written another way. */
export function UnitToggle<U extends string>({ units, value, onChange }: UnitToggleProps<U>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("lab.units.label")}>
      <span className="text-sm font-semibold">{t("lab.units.label")}</span>
      {units.map((unit) => (
        <CardboardButton
          key={unit}
          tone={unit === value ? "active" : "card"}
          aria-pressed={unit === value}
          onClick={() => onChange(unit)}
          className="min-w-11 px-3 text-sm"
        >
          {t(`lab.units.${unit}`)}
        </CardboardButton>
      ))}
    </div>
  );
}
