import { useEffect, useState } from "react";
import { Compass, Layers, ListOrdered, Map, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SectionId =
  | "section-maps"
  | "section-student-comparison"
  | "section-discovery"
  | "section-decomposition"
  | "section-diagnostics"
  | "section-ranking";

interface SectionNavProps {
  visibleSections: Partial<Record<SectionId, boolean>>;
}

export function SectionNav({ visibleSections }: SectionNavProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<SectionId>("section-maps");

  const items: Array<{ id: SectionId; label: string; icon: typeof Map }> = [
    { id: "section-maps", label: t("nav.maps"), icon: Map },
    { id: "section-student-comparison", label: t("nav.studentComparison"), icon: Sparkles },
    { id: "section-discovery", label: t("nav.discovery"), icon: Sparkles },
    { id: "section-decomposition", label: t("nav.decomposition"), icon: Layers },
    { id: "section-diagnostics", label: t("nav.diagnostics"), icon: Compass },
    { id: "section-ranking", label: t("nav.ranking"), icon: ListOrdered },
  ];

  const availableItems = items.filter((item) => visibleSections[item.id]);
  const availableKey = availableItems.map((item) => item.id).join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !availableKey) return;

    const ids = availableKey.split(",") as SectionId[];
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

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [availableKey]);

  if (availableItems.length === 0) return null;

  return (
    <nav
      aria-label={t("nav.label")}
      className="no-scrollbar sticky top-[var(--header-h,4.25rem)] z-20 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border-subtle/90 bg-surface-elevated/90 p-1.5 shadow-sm backdrop-blur-md"
    >
      {availableItems.map((item) => {
        const Icon = item.icon;
        const active = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActiveId(item.id)}
            className={`inline-flex min-h-10 sm:min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 sm:px-3.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/25"
                : "text-content-muted hover:bg-surface-muted/80 hover:text-content"
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
