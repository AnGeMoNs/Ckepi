import { BookOpen, Database, Globe2, MapPin, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

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
          <div className="flex flex-wrap items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
            <CardTitle>{t("evidence.title")}</CardTitle>
            <Badge variant="accent">{t("app.challengeBadge")}</Badge>
          </div>
          <p className="mt-1 text-xs text-content-muted sm:text-sm">{t("evidence.subtitle")}</p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-content">
              <Globe2 className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>
                <span aria-label={t("nav.globalLabel")}>🌎</span> {t("evidence.globalTitle")}
              </span>
            </div>
            <p className="mt-1.5 text-content-muted">{t("evidence.globalDesc")}</p>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-content">
              <MapPin className="h-4 w-4 text-status-break" aria-hidden="true" />
              <span>
                <span aria-label={t("nav.locationLabel")}>📍</span> {t("evidence.locationTitle")}
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
            <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
            <CardTitle>{t("evidence.methodTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-content-muted sm:text-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="font-semibold text-content">{t("evidence.xTitle")}</p>
              <p className="mt-1 text-xs">{t("evidence.xDesc")}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="font-semibold text-content">{t("evidence.yTitle")}</p>
              <p className="mt-1 text-xs">{t("evidence.yDesc")}</p>
            </div>
            <div className="rounded-xl border border-status-break/30 bg-status-break/5 p-3">
              <p className="font-semibold text-content">{t("evidence.bTitle")}</p>
              <p className="mt-1 text-xs">{t("evidence.bDesc")}</p>
            </div>
          </div>

          {activeSite && (
            <p className="text-xs">
              <strong className="text-content">{t("evidence.activeProvenance")}:</strong>{" "}
              {activeSite.provenance.source_apis.join(" · ")} ({activeSite.provenance.observation_window})
            </p>
          )}
          {comparison && (
            <p className="text-xs">
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
            <Database className="h-5 w-5 text-accent" aria-hidden="true" />
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
                        {t(`confidence.origin_${src.origin}`)}
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
            <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
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
