import { Globe2, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SupportedLocale, ThemeMode } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const LOCALES: SupportedLocale[] = ["es", "pt", "en"];

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Globe2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-content sm:text-xl">
                {t("app.title")}
              </h1>
              <Badge variant="accent">{t("app.challengeBadge")}</Badge>
            </div>
            <p className="truncate text-xs text-content-muted sm:text-sm">{t("app.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t("app.languageLabel")}
            className="inline-flex rounded-lg border border-border-subtle bg-surface p-0.5"
          >
            {LOCALES.map((loc) => {
              const active = i18n.language.startsWith(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    void i18n.changeLanguage(loc);
                  }}
                  aria-pressed={active}
                  className={`min-h-11 min-w-11 rounded-md px-2.5 text-xs font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-content-muted hover:bg-surface-muted hover:text-content"
                  }`}
                >
                  {loc}
                </button>
              );
            })}
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
            <span className="hidden sm:inline">
              {theme === "dark" ? t("app.themeLight") : t("app.themeDark")}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}

