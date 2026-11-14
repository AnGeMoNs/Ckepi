import { Globe2, Moon, SlidersHorizontal, Sun } from "lucide-react";
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
  const activeLocale = (LOCALES.find((loc) => i18n.language.startsWith(loc)) ??
    "es") as SupportedLocale;

  const readingOptions = READING_MODES.map((mode) => ({
    value: mode,
    label: t(`app.modes.${mode}`),
  }));

  const localeOptions = LOCALES.map((loc) => ({
    value: loc,
    label: loc.toUpperCase(),
  }));

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Globe2 className="h-6 w-6" aria-hidden="true" />
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

          <details className="relative md:hidden">
            <summary
              aria-label={t("app.mobileMenuLabel")}
              className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-content hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="uppercase">{activeLocale}</span>
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-64 space-y-3 rounded-xl border border-border-subtle bg-surface-elevated p-3 shadow-elevated">
              <div className="space-y-1">
                <p className="text-xs font-medium text-content-muted">
                  {t("app.readingModeLabel")}
                </p>
                <SegmentedControl
                  ariaLabel={t("app.readingModeLabel")}
                  options={readingOptions}
                  value={readingMode}
                  onChange={onChangeReadingMode}
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
                  }}
                  fullWidth
                />
              </div>
            </div>
          </details>

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
