import { useEffect, useState } from "react";
import { Compass, Layers, ListOrdered, Map } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SectionId =
  | "section-maps"
  | "section-decomposition"
  | "section-diagnostics"
  | "section-ranking";

interface SectionNavProps {
  visibleSections: Record<SectionId, boolean>;
}

export function SectionNav({ visibleSections }: SectionNavProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<SectionId>("section-maps");

  const items: Array<{ id: SectionId; label: string; icon: typeof Map }> = [
    { id: "section-maps", label: t("nav.maps"), icon: Map },
    { id: "section-decomposition", label: t("nav.decomposition"), icon: Layers },
    { id: "section-diagnostics", label: t("nav.diagnostics"), icon: Compass },
    { id: "section-ranking", label: t("nav.ranking"), icon: ListOrdered },
  ];

  const availableItems = items.filter((item) => visibleSections[item.id]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || availableItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id as SectionId);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.4] }
    );

    for (const item of availableItems) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [availableItems]);

  if (availableItems.length === 0) return null;

  return (
    <nav
      aria-label={t("nav.label")}
      className="sticky top-[65px] z-20 -mx-1 flex items-center gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-surface-elevated/95 p-1 backdrop-blur"
    >
      {availableItems.map((item) => {
        const Icon = item.icon;
        const active = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActiveId(item.id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-content-muted hover:bg-surface-muted hover:text-content"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
