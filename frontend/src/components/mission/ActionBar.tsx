import { Check, RefreshCw, Share2, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatTimestamp } from "../../i18n";
import type { PlanetarySite } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface ActionBarProps {
  activeSite?: PlanetarySite;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  isUpdating: boolean;
  copiedLink: boolean;
  onRefreshApis: () => void;
  onShareLink: () => void;
  onOpenMobileSettings: () => void;
}

export function ActionBar({
  activeSite,
  lastUpdated,
  isRefreshing,
  isUpdating,
  copiedLink,
  onRefreshApis,
  onShareLink,
  onOpenMobileSettings,
}: ActionBarProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3">
      {/* Left: Metadata & Context */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-content-muted">
        {activeSite && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-content">{t(activeSite.name_key)}</span>
            <span>·</span>
            <span>{t("controls.dataSources")}:</span>
            {activeSite.data_sources.map((src) => (
              <Badge key={src} variant="default">
                {src}
              </Badge>
            ))}
          </div>
        )}
        {lastUpdated && (
          <span>
            · {t("controls.lastUpdated")}: {formatTimestamp(lastUpdated, lang)}
          </span>
        )}
        {isUpdating && (
          <Badge variant="accent">
            <RefreshCw
              className="h-3 w-3 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {t("controls.updating")}
          </Badge>
        )}
      </div>

      {/* Right: Primary & Secondary Actions */}
      <div
        role="group"
        aria-label={t("controls.actionsGroup")}
        className="flex flex-wrap items-center gap-2"
      >
        <Button
          variant="primary"
          onClick={onOpenMobileSettings}
          className="xl:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>{t("controls.openSettings")}</span>
        </Button>

        <Button
          variant="secondary"
          disabled={isRefreshing}
          onClick={onRefreshApis}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />
          <span>{isRefreshing ? t("controls.refreshing") : t("controls.refreshApis")}</span>
        </Button>

        <Button variant="secondary" onClick={onShareLink}>
          {copiedLink ? (
            <Check className="h-4 w-4 text-status-valid" aria-hidden="true" />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{copiedLink ? t("controls.copiedLink") : t("controls.shareLink")}</span>
        </Button>
      </div>
    </div>
  );
}
