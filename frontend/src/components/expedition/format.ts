import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Locale-aware number formatting (decimal comma in es/pt). */
export function useNumberFormat() {
  const { i18n } = useTranslation();
  return useCallback(
    (value: number, digits = 2) =>
      new Intl.NumberFormat(i18n.language, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value),
    [i18n.language]
  );
}
