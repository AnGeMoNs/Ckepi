import { useTranslation } from "react-i18next";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";

import { formatNumber, formatPercent } from "../../i18n";
import type { PlanetarySite } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";

interface DataConfidenceBannerProps {
  site: PlanetarySite;
}

export function DataConfidenceBanner({ site }: DataConfidenceBannerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const conf = site.confidence;

  if (!conf) return null;

  const badgeVariant =
    conf.level === "high" ? "valid" : conf.level === "medium" ? "warn" : "break";

  const containerBorder =
    conf.level === "high"
      ? "border-status-valid/60 bg-status-valid/15"
      : conf.level === "medium"
      ? "border-status-warn/60 bg-status-warn/15"
      : "border-status-break/60 bg-status-break/15";

  const pictogram: PictogramName =
    conf.level === "high" ? "check" : conf.level === "medium" ? "info" : "notSimilar";

  const iconColor =
    conf.level === "high"
      ? "text-status-valid"
      : conf.level === "medium"
      ? "text-status-warn"
      : "text-status-break";

  const nearestLabel = conf.nearest_tracked_site_id
    ? t(`sites.${conf.nearest_tracked_site_id}.name`)
    : t("confidence.unknownSite");

  return (
    <Card className={containerBorder}>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pictogram name={pictogram} className={`h-5 w-5 shrink-0 ${iconColor}`} />
            <h2 className="text-sm font-semibold text-content">{t("confidence.title")}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {site.planetary_feature && (
              <Badge variant="accent">
                {t("confidence.iauFeatureBadge", {
                  name: site.planetary_feature.feature_name,
                  elev: formatNumber(site.planetary_feature.elevation_m, lang, 0),
                })}
              </Badge>
            )}
            <Badge variant={badgeVariant}>
              {t(`confidence.levels.${conf.level}`)} · {formatPercent(conf.score, lang)}
            </Badge>
            {conf.pds_products_found !== null && conf.pds_products_found !== undefined && (
              <Badge variant="accent">
                {t("confidence.pdsCount", { count: conf.pds_products_found })}
              </Badge>
            )}
            {!conf.is_tracked_zone &&
              conf.distance_to_tracked_km !== null &&
              conf.distance_to_tracked_km !== undefined && (
                <Badge variant="default">
                  {t("confidence.distanceKm", {
                    km: formatNumber(conf.distance_to_tracked_km, lang, 0),
                    site: nearestLabel,
                  })}
                </Badge>
              )}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-content sm:text-sm">
          {t(conf.notice_key, {
            site: nearestLabel,
            km:
              conf.distance_to_tracked_km !== null && conf.distance_to_tracked_km !== undefined
                ? formatNumber(conf.distance_to_tracked_km, lang, 0)
                : "0",
            count:
              conf.pds_products_found !== null && conf.pds_products_found !== undefined
                ? conf.pds_products_found
                : 0,
          })}
        </p>

        {conf.variable_provenance && Object.keys(conf.variable_provenance).length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-border-subtle pt-2.5">
            {Object.entries(conf.variable_provenance).map(([varKey, origin]) => {
              const variant =
                origin === "measured"
                  ? "valid"
                  : origin === "derived"
                  ? "accent"
                  : origin === "model"
                  ? "warn"
                  : "default";
              return (
                <Badge key={varKey} variant={variant}>
                  {t(`variables.${varKey}.label`)} · {t(`confidence.origins.${origin}`)}
                </Badge>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 border-t border-border-subtle pt-2.5 text-xs md:grid-cols-2">
            <div className="space-y-1">
              <span className="font-semibold text-status-valid">
                {t("confidence.realVarsLabel")}:
              </span>{" "}
              <span className="text-content-muted">
                {conf.real_variables.map((v) => t(`variables.${v}.label`)).join(", ")}
              </span>
            </div>
            {conf.estimated_variables.length > 0 && (
              <div className="space-y-1">
                <span className="font-semibold text-status-warn">
                  {t("confidence.estimatedVarsLabel")}:
                </span>{" "}
                <span className="text-content-muted">
                  {conf.estimated_variables.map((v) => t(`variables.${v}.label`)).join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
