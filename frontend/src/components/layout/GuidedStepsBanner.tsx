import { useState } from "react";
import { ChevronDown, ChevronUp, Database, Globe, HelpCircle, Radio, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";

export function GuidedStepsBanner() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <Card>
      <CardContent className="space-y-3 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-content">{t("guide.title")}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-1.5 sm:flex">
              <Badge variant="accent">
                <Radio className="mr-1 h-3 w-3" aria-hidden="true" />
                {t("guide.badgeLiveApi")}
              </Badge>
              <Badge variant="default">
                <Database className="mr-1 h-3 w-3" aria-hidden="true" />
                {t("guide.badgeCatalog")}
              </Badge>
              <Badge variant="warn">
                <Sliders className="mr-1 h-3 w-3" aria-hidden="true" />
                {t("guide.badgeModel")}
              </Badge>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border-subtle bg-surface px-3 text-xs font-medium text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>{expanded ? t("guide.hide") : t("guide.show")}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-3 md:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded border border-border-subtle bg-surface p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                1
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-content">{t("guide.step1Title")}</p>
                <p className="text-xs text-content-muted">{t("guide.step1Desc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded border border-border-subtle bg-surface p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                2
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-content">{t("guide.step2Title")}</p>
                <p className="text-xs text-content-muted">{t("guide.step2Desc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded border border-border-subtle bg-surface p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                3
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-content">{t("guide.step3Title")}</p>
                <p className="text-xs text-content-muted">{t("guide.step3Desc")}</p>
              </div>
            </div>
          </div>
        )}

        {expanded && (
          <p className="flex items-center gap-1.5 text-xs text-content-muted">
            <Globe className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>{t("guide.transparencyNote")}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

