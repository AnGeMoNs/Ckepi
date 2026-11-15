import { useTranslation } from "react-i18next";

import { SHOW_AI_WATERMARKS } from "../../config/aiDisclosure";

interface AiSealProps {
  className?: string;
}

/**
 * Visible watermark required by the Space Apps 2026 submission guide for AI-generated images
 * and videos ("Must include a visible watermark to indicate SI generation"). Drawn as a small
 * cardboard tag so it belongs to the identity instead of covering it.
 */
export function AiSeal({ className = "" }: AiSealProps) {
  const { t } = useTranslation();
  if (!SHOW_AI_WATERMARKS) return null;
  return (
    <span
      className={`ckepi-cardboard pointer-events-none inline-flex select-none items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none sm:text-xs ${className}`}
    >
      {t("ai.seal")}
    </span>
  );
}
