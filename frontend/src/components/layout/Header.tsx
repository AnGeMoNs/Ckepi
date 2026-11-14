import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ReadingMode, SupportedLocale, ThemeMode } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  readingMode: ReadingMode;
  onChangeReadingMode: (mode: ReadingMode) => void;
}

const LOCALES: SupportedLocale[] = ["es", "pt", "en"];
const READING_MODES: ReadingMode[] = ["mission", "explorer"];

export function Header({
  theme,
  onToggleTheme,
  readingMode,
  onChangeReadingMode,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const headerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const activeLocale = (LOCALES.find((loc) => i18n.language.startsWith(loc)) ??
    "es") as SupportedLocale;

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof document === "undefined") return;
    const updateHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    updateHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (menu && !menu.hasAttribute("popover")) {
      menu.setAttribute("popover", "auto");
    }
  }, []);

  const positionAndToggleMenu = () => {
    const btn = triggerRef.current;
    const menu = menuRef.current as (HTMLDivElement & {
      togglePopover?: () => boolean;
      matches?: (selector: string) => boolean;
    }) | null;
    if (!btn || !menu) return;

    const rect = btn.getBoundingClientRect();
    const rightOffset = Math.max(8, window.innerWidth - rect.right);
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.right = `${rightOffset}px`;
    menu.style.left = "auto";
    menu.style.position = "fixed";

    if (typeof menu.togglePopover === "function") {
      menu.togglePopover();
    }
  };

  const closeMobileMenu = () => {
    const menu = menuRef.current as (HTMLDivElement & { hidePopover?: () => void }) | null;
    if (menu && typeof menu.hidePopover === "function") {
      try {
        menu.hidePopover();
      } catch {
        // Ignore if already closed
      }
    }
  };

  const readingOptions = READING_MODES.map((mode) => ({
    value: mode,
    label: t(`app.modes.${mode}`),
  }));

  const localeOptions = LOCALES.map((loc) => ({
    value: loc,
    label: loc.toUpperCase(),
  }));

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-border-subtle bg-surface-elevated/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ckepi-space">
            <img src="/img/ckepi/svg/ckepi-symbol-vector-dark.svg" alt="" width={36} height={36} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-bold tracking-tight text-content sm:text-xl">
                {t("app.title")}
              </h1>
              <Badge variant="accent" className="hidden sm:inline-flex">
                {t("app.challengeBadge")}
              </Badge>
            </div>
            <p className="truncate text-xs text-content-muted sm:text-sm">{t("app.subtitle")}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <SegmentedControl
              ariaLabel={t("app.readingModeLabel")}
              options={readingOptions}
              value={readingMode}
              onChange={onChangeReadingMode}
            />
            <SegmentedControl
              ariaLabel={t("app.languageLabel")}
              options={localeOptions}
              value={activeLocale}
              size="sm"
              onChange={(loc) => {
                void i18n.changeLanguage(loc);
              }}
            />
          </div>

          <div className="md:hidden">
            <button
              ref={triggerRef}
              type="button"
              aria-label={t("app.mobileMenuLabel")}
              aria-controls={menuId}
              aria-haspopup="dialog"
              onClick={positionAndToggleMenu}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-content hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="uppercase">{activeLocale}</span>
            </button>

            <div
              ref={menuRef}
              id={menuId}
              className="m-0 w-64 max-w-[calc(100vw-1rem)] space-y-3 rounded-xl border border-border-subtle bg-surface-elevated p-3 text-content shadow-elevated"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium text-content-muted">
                  {t("app.readingModeLabel")}
                </p>
                <SegmentedControl
                  ariaLabel={t("app.readingModeLabel")}
                  options={readingOptions}
                  value={readingMode}
                  onChange={(mode) => {
                    onChangeReadingMode(mode);
                    closeMobileMenu();
                  }}
                  fullWidth
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-content-muted">
                  {t("app.languageLabel")}
                </p>
                <SegmentedControl
                  ariaLabel={t("app.languageLabel")}
                  options={localeOptions}
                  value={activeLocale}
                  onChange={(loc) => {
                    void i18n.changeLanguage(loc);
                    closeMobileMenu();
                  }}
                  fullWidth
                />
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? t("app.themeLight") : t("app.themeDark")}
            title={theme === "dark" ? t("app.themeLight") : t("app.themeDark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden lg:inline">
              {theme === "dark" ? t("app.themeLight") : t("app.themeDark")}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
