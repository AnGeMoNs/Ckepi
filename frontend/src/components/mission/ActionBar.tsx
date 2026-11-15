import { useTranslation } from "react-i18next";
import { Pictogram } from "../worlds/Pictograms";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface ActionBarProps {
  isRefreshing: boolean;
  isUpdating: boolean;
  copiedLink: boolean;
  onRefreshApis: () => void;
  onShareLink: () => void;
  onOpenMobileSettings: () => void;
}

export function ActionBar({
  isRefreshing,
  isUpdating,
  copiedLink,
  onRefreshApis,
  onShareLink,
  onOpenMobileSettings,
}: ActionBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {/* Left: live status only (data sources live in the Sources tab, not here). */}
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-content-muted">
        {isUpdating && (
          <Badge variant="accent">
            <Pictogram name="replay" className="h-3 w-3 animate-spin motion-reduce:animate-none" />
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
          <Pictogram name="tune" className="h-4 w-4" />
          <span>{t("controls.openSettings")}</span>
        </Button>

        <Button
          variant="secondary"
          disabled={isRefreshing}
          onClick={onRefreshApis}
          className="w-full sm:w-auto"
        >
          <Pictogram name="replay" className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />
          <span className="truncate">
            {isRefreshing ? t("controls.refreshing") : t("controls.refreshApis")}
          </span>
        </Button>

        <Button variant="secondary" onClick={onShareLink} className="w-full sm:w-auto">
          {copiedLink ? (
            <Pictogram name="check" className="h-4 w-4 shrink-0 text-status-valid" />
          ) : (
            <Pictogram name="share" className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {copiedLink ? t("controls.copiedLink") : t("controls.shareLink")}
          </span>
        </Button>
      </div>
    </div>
  );
}
