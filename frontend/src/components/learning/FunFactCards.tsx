import { memo, useMemo, useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PlanetaryBody } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { sortFunFactsForBody, type FunFactTag } from "./funFacts";

interface FunFactCardsProps {
  body: PlanetaryBody;
}

type Filter = "all" | FunFactTag;

const TAG_VARIANT: Record<FunFactTag, "mars" | "moon" | "valid"> = {
  mars: "mars",
  moon: "moon",
  atacama: "valid",
};

export const FunFactCards = memo(function FunFactCards({ body }: FunFactCardsProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<Filter>("all");

  const ordered = useMemo(() => sortFunFactsForBody(body), [body]);
  const visible = filter === "all" ? ordered : ordered.filter((f) => f.tag === filter);
  const total = ordered.length;
  const discovered = revealed.size;

  const toggle = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filters: Filter[] = ["all", "mars", "moon", "atacama"];

  return (
    <section aria-labelledby="fun-facts-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 id="fun-facts-title" className="flex items-center gap-2 text-base font-semibold text-content">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
            {t("funFacts.title")}
          </h3>
          <p className="text-xs text-content-muted">{t("funFacts.subtitle")}</p>
        </div>
        <div className="w-full max-w-xs space-y-1" aria-live="polite">
          <p className="text-right text-xs font-semibold text-content">
            {t("funFacts.progress", { count: discovered, total })}
          </p>
          <ProgressBar
            value={total ? discovered / total : 0}
            tone={discovered === total ? "valid" : "accent"}
            label={t("funFacts.progress", { count: discovered, total })}
          />
        </div>
      </div>

      <div role="group" aria-label={t("funFacts.filterLabel")} className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className={`min-h-11 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border-subtle bg-surface text-content-muted hover:bg-surface-muted hover:text-content"
              }`}
            >
              {f === "all" ? t("funFacts.filterAll") : t(`funFacts.tags.${f}`)}
            </button>
          );
        })}
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((fact) => {
          const isOpen = revealed.has(fact.id);
          const answerId = `fun-fact-answer-${fact.id}`;
          return (
            <li key={fact.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggle(fact.id)}
                className={`group flex h-full min-h-[8.5rem] w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isOpen
                    ? "border-accent/50 bg-accent/5"
                    : "border-border-subtle bg-surface hover:border-accent/40 hover:bg-surface-muted"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {fact.emoji}
                  </span>
                  <Badge variant={TAG_VARIANT[fact.tag]}>{t(`funFacts.tags.${fact.tag}`)}</Badge>
                </span>
                <span className="text-sm font-semibold text-content">
                  {t(`funFacts.items.${fact.id}.q`)}
                </span>
                <span id={answerId} className={isOpen ? "space-y-1.5" : "sr-only"}>
                  {isOpen && (
                    <>
                      <span className="block text-xs text-content-muted">
                        {t(`funFacts.items.${fact.id}.a`)}
                      </span>
                      <span className="block text-[11px] italic text-content-muted/80">
                        {t("funFacts.sourceLabel")}: {fact.source}
                      </span>
                    </>
                  )}
                </span>
                <span className="mt-auto flex items-center gap-1.5 text-xs font-medium text-accent">
                  {isOpen ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isOpen ? t("funFacts.hide") : t("funFacts.tapToReveal")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {discovered === total && (
        <p
          role="status"
          className="rounded-xl border border-status-valid/40 bg-status-valid/10 p-3 text-center text-sm font-semibold text-content"
        >
          {t("funFacts.allDiscovered")}
        </p>
      )}
    </section>
  );
});
