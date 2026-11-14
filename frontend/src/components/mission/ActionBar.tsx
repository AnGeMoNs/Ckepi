import { Check, Clock, RefreshCw, Share2, SlidersHorizontal } from "lucide-react";
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

  const syncedDate = activeSite?.provenance?.fetched_at
    ? new Date(activeSite.provenance.fetched_at)
    : lastUpdated;

  const elapsedLabel = (() => {
    if (!syncedDate || Number.isNaN(syncedDate.getTime())) return null;
    const mins = Math.max(0, Math.floor((Date.now() - syncedDate.getTime()) / 60000));
    if (mins < 1) return t("telemetryAndRover.elapsedJustNow");
    if (mins < 60) return t("telemetryAndRover.elapsedMinutes", { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("telemetryAndRover.elapsedHours", { count: hrs, mins: mins % 60 });
    return t("telemetryAndRover.elapsedDays", { count: Math.floor(hrs / 24) });
  })();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle/90 bg-surface-elevated/95 p-3.5 shadow-sm backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
      {/* Left: Metadata & Context */}
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-content-muted">
        {activeSite && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-content">{t(activeSite.name_key)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{t("controls.dataSources")}:</span>
            <div className="flex flex-wrap items-center gap-1">
              {activeSite.data_sources.map((src) => (
                <Badge key={src} variant="default">
                  {src}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {syncedDate && !Number.isNaN(syncedDate.getTime()) && (
          <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
            <span>
              · {t("controls.lastUpdated")}: {formatTimestamp(syncedDate, lang)}
            </span>
            {elapsedLabel && (
              <Badge variant="accent">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{elapsedLabel}</span>
              </Badge>
            )}
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
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center"
      >
        <Button
          variant="primary"
          onClick={onOpenMobileSettings}
          className="col-span-2 xl:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>{t("controls.openSettings")}</span>
        </Button>

        <Button
          variant="secondary"
          disabled={isRefreshing}
          onClick={onRefreshApis}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />
          <span className="truncate">
            {isRefreshing ? t("controls.refreshing") : t("controls.refreshApis")}
          </span>
        </Button>

        <Button variant="secondary" onClick={onShareLink} className="w-full sm:w-auto">
          {copiedLink ? (
            <Check className="h-4 w-4 shrink-0 text-status-valid" aria-hidden="true" />
          ) : (
            <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">
            {copiedLink ? t("controls.copiedLink") : t("controls.shareLink")}
          </span>
        </Button>
      </div>
    </div>
  );
}
