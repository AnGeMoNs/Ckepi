import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import es from "./es.json";
import pt from "./pt.json";
import type { SupportedLocale } from "../types/analog";

const LOCALE_MAP: Record<SupportedLocale, string> = {
  es: "es-CL",
  pt: "pt-BR",
  en: "en-US",
};

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: "es",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function getActiveIntlLocale(lang: string): string {
  const key = lang.slice(0, 2) as SupportedLocale;
  return LOCALE_MAP[key] ?? "en-US";
}

export function formatPercent(value: number, lang: string): string {
  return new Intl.NumberFormat(getActiveIntlLocale(lang), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number, lang: string, maxDecimals = 2): string {
  if (Math.abs(value) > 0 && Math.abs(value) < 0.0001) {
    return value.toExponential(1);
  }
  return new Intl.NumberFormat(getActiveIntlLocale(lang), {
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatTimestamp(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(getActiveIntlLocale(lang), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default i18n;

