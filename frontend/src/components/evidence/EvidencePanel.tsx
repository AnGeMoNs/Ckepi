import { useTranslation } from "react-i18next";
import { Pictogram } from "../worlds/Pictograms";

import type { PlanetarySite, SiteComparisonResponse } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface EvidencePanelProps {
  activeSite?: PlanetarySite;
  comparison?: SiteComparisonResponse | null;
}

const DATA_SOURCES = [
  {
    agency: "NASA",
    name: "Moon Trek & Mars Trek WMTS",
    roleKey: "evidence.sources.trek",
    origin: "measured",
  },
  {
    agency: "NASA",
    name: "PDS ODE (LRO LOLA/Diviner, MRO, MSL REMS, Mars2020 MEDA)",
    roleKey: "evidence.sources.pds",
    origin: "measured",
  },
  {
    agency: "NASA",
    name: "NASA POWER Climatology & Earthdata CMR / GIBS",
    roleKey: "evidence.sources.power",
    origin: "measured",
  },
  {
    agency: "Copernicus / Open-Meteo",
    name: "Copernicus DEM 90m & ERA5-Land",
    roleKey: "evidence.sources.copernicus",
    origin: "derived",
  },
  {
    agency: "ISRIC / Macrostrat / ESA / CSA / JAXA",
    name: "SoilGrids v2.0, Macrostrat, Sentinel-1/2, RADARSAT, G-Portal",
    roleKey: "evidence.sources.partners",
    origin: "model",
  },
] as const;

export function EvidencePanel({ activeSite, comparison }: EvidencePanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Global vs Location Distinction */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <img src="/img/science-accessories/ckepi-pin-location.webp" alt="" width={56} height={56} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo" />
            <CardTitle>{t("evidence.title")}</CardTitle>
            <Badge variant="accent">{t("app.challengeBadge")}</Badge>
          </div>
          <p className="mt-2 text-sm text-content-muted sm:text-base">{t("evidence.subtitle")}</p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="ckepi-liquid rounded-3xl p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold text-content">
              <Pictogram name="globe" className="h-6 w-6 text-accent" />
              <span>
                {t("evidence.globalTitle")}
              </span>
            </div>
            <p className="mt-1.5 text-content-muted">{t("evidence.globalDesc")}</p>
          </div>

          <div className="ckepi-liquid rounded-3xl p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold text-content">
              <Pictogram name="hexCell" className="h-6 w-6 text-accent" />
              <span>
                {t("evidence.locationTitle")}
              </span>
            </div>
            <p className="mt-1.5 text-content-muted">{t("evidence.locationDesc")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Scientific Method X -> Y and Breakage B */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <img src="/img/planets/ckepi-planet-science.webp" alt="" width={56} height={56} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo" />
            <CardTitle>{t("evidence.methodTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-content-muted sm:text-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="ckepi-liquid flex flex-col items-center rounded-3xl p-5 text-center">
              <img src="/img/science-accessories/ckepi-icon-relief.webp" alt="" width={56} height={56} className="h-12 w-12 object-contain drop-shadow-ckepi-logo" />
              <p className="mt-2 text-base font-bold text-content">{t("evidence.xTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed">{t("evidence.xDesc")}</p>
            </div>
            <div className="ckepi-liquid flex flex-col items-center rounded-3xl p-5 text-center">
              <img src="/img/science-accessories/ckepi-icon-temperature.webp" alt="" width={56} height={56} className="h-12 w-12 object-contain drop-shadow-ckepi-logo" />
              <p className="mt-2 text-base font-bold text-content">{t("evidence.yTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed">{t("evidence.yDesc")}</p>
            </div>
            <div className="ckepi-liquid flex flex-col items-center rounded-3xl p-5 text-center">
              <img src="/img/science-accessories/ckepi-icon-gravity.webp" alt="" width={56} height={56} className="h-12 w-12 object-contain drop-shadow-ckepi-logo" />
              <p className="mt-2 text-base font-bold text-content">{t("evidence.bTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed">{t("evidence.bDesc")}</p>
            </div>
          </div>

          {activeSite && (
            <p className="text-sm">
              <strong className="text-content">{t("evidence.activeProvenance")}:</strong>{" "}
              {activeSite.provenance.source_apis.join(" · ")} ({activeSite.provenance.observation_window})
            </p>
          )}
          {comparison && (
            <p className="text-sm">
              <strong className="text-content">{t("evidence.earthProvenance")}:</strong>{" "}
              {comparison.match.provenance.source_apis.join(" · ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Open Data Sources Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <img src="/img/science-accessories/ckepi-icon-soil.webp" alt="" width={56} height={56} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo" />
            <CardTitle>{t("evidence.sourcesTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-content-muted">
                  <th className="py-2 pr-3 font-semibold">{t("evidence.table.agency")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("evidence.table.dataset")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("evidence.table.role")}</th>
                  <th className="py-2 font-semibold">{t("evidence.table.type")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {DATA_SOURCES.map((src) => (
                  <tr key={src.name}>
                    <td className="py-2.5 pr-3 font-semibold text-content">{src.agency}</td>
                    <td className="py-2.5 pr-3 text-content">{src.name}</td>
                    <td className="py-2.5 pr-3 text-content-muted">{t(src.roleKey)}</td>
                    <td className="py-2.5">
                      <Badge
                        variant={
                          src.origin === "measured"
                            ? "valid"
                            : src.origin === "derived"
                            ? "accent"
                            : "warn"
                        }
                      >
                        {t(`confidence.origins.${src.origin}`)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Usage Disclosure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <img src="/img/science-accessories/ckepi-icon-atmosphere.webp" alt="" width={56} height={56} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo" />
            <CardTitle>{t("evidence.aiDisclosureTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-content-muted sm:text-sm">{t("evidence.aiDisclosureDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
