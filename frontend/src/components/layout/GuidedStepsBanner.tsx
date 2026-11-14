import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Globe,
  HelpCircle,
  Radio,
  Sliders,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";

const GUIDE_DISMISSED_KEY = "ckepi-guide-dismissed";

function getInitialDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUIDE_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

interface GuidedStepsBannerProps {
  activeStep?: 1 | 2 | 3;
}

export function GuidedStepsBanner({ activeStep = 1 }: GuidedStepsBannerProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState<boolean>(getInitialDismissed);

  const handleDismiss = (next: boolean) => {
    setDismissed(next);
    try {
      window.localStorage.setItem(GUIDE_DISMISSED_KEY, next ? "1" : "0");
    } catch {
      // Ignore storage errors
    }
  };

  if (dismissed) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => handleDismiss(false)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-elevated px-3 text-xs font-medium text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <HelpCircle className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>{t("guide.reopen")}</span>
        </button>
      </div>
    );
  }

  const steps: Array<{ num: 1 | 2 | 3; title: string; desc: string }> = [
    { num: 1, title: t("guide.step1Title"), desc: t("guide.step1Desc") },
    { num: 2, title: t("guide.step2Title"), desc: t("guide.step2Desc") },
    { num: 3, title: t("guide.step3Title"), desc: t("guide.step3Desc") },
  ];

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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-medium text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>{expanded ? t("guide.hide") : t("guide.show")}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDismiss(true)}
              aria-label={t("guide.dismiss")}
              title={t("guide.dismiss")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-subtle bg-surface text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-3 md:grid-cols-3">
            {steps.map((step) => {
              const isCompleted = step.num < activeStep;
              const isCurrent = step.num === activeStep;
              return (
                <div
                  key={step.num}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                    isCurrent
                      ? "border-accent/50 bg-accent/5"
                      : "border-border-subtle bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCompleted
                        ? "bg-status-valid text-accent-foreground"
                        : isCurrent
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-muted text-content-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      step.num
                    )}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-content">{step.title}</p>
                    <p className="text-xs text-content-muted">{step.desc}</p>
                  </div>
                </div>
              );
            })}
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
