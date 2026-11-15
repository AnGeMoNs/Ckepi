import { useTranslation } from "react-i18next";

interface CopernicusNoticeProps {
  className?: string;
  /** "onDark" for pages that are always dark (intro story), regardless of the theme. */
  tone?: "default" | "onDark";
}

/**
 * Copernicus WorldDEM-30 modified-data notice, required wherever the terrain comparison
 * (Copernicus GLO-30 vs. CTX Jezero) is shown. It is legal text, so it stays in English in
 * every language (`lang="en"` lets screen readers pronounce it correctly).
 */
export function CopernicusNotice({ className = "", tone = "default" }: CopernicusNoticeProps) {
  const { t } = useTranslation();
  return (
    <p lang="en" className={`text-[11px] leading-snug ${tone === "onDark" ? "text-ckepi-salt/80" : "text-content-muted"} ${className}`}>
      {t("legal.copernicus.produced")} {t("legal.copernicus.liability")}
    </p>
  );
}
