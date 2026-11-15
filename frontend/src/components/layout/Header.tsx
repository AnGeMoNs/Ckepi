import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Languages } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReadingMode, SupportedLocale, ThemeMode } from "../../types/analog";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  readingMode: ReadingMode;
  onChangeReadingMode: (mode: ReadingMode) => void;
  onOpenSteamModal?: () => void;
}
const LOCALES: SupportedLocale[] = ["es", "pt", "en"];

export function Header({ theme, onToggleTheme, readingMode, onChangeReadingMode }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement | null>(null);
  const languageRoot = useRef<HTMLDivElement | null>(null);
  const languageTrigger = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const [languageOpen, setLanguageOpen] = useState(false);
  const locale = LOCALES.find((lang) => i18n.language.startsWith(lang)) ?? "es";
  const home = new URL(window.location.href);
  home.searchParams.set("view", "app");
  home.searchParams.set("tab", readingMode === "mission" ? "start" : "compare");
  home.hash = "";

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const sync = () => document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!languageOpen) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !languageRoot.current?.contains(event.target)) setLanguageOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setLanguageOpen(false); languageTrigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [languageOpen]);

  return (
    <header ref={headerRef} className="ckepi-header relative z-30">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-6">
        <a href={home.pathname + home.search} aria-label={t("scientificHeader.home")} className="shrink-0 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <img src={theme === "dark" ? "/img/ckepi/svg/ckepi-horizontal-color-dark.svg" : "/img/ckepi/svg/ckepi-horizontal-color-light.svg"} alt="Ckepi" width={900} height={280} className="h-11 w-auto sm:h-14" />
        </a>
        <LayoutGroup id="header-roles">
          <div role="group" aria-label={t("app.readingModeLabel")} className="order-3 flex w-full justify-center gap-1 p-1 sm:order-none sm:w-auto">
            {(["explorer", "mission"] as const).map((mode) => <motion.button key={mode} type="button" onClick={() => onChangeReadingMode(mode)} aria-label={t(mode === "mission" ? "modeBanner.switchToScience" : "modeBanner.switchToStudent")} aria-pressed={readingMode === mode} whileTap={reducedMotion ? undefined : { scale: 0.97 }} className="relative flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none">
              {readingMode === mode && <motion.span layoutId="role-glass-lens" className="absolute inset-0 rounded-xl border border-accent/60 bg-accent/15 shadow-sm" aria-hidden="true" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }} />}
              <motion.img src={`/img/planets/ckepi-planet-${mode === "mission" ? "science" : "steam"}.webp`} alt="" width={40} height={40} className="relative h-10 w-10 object-contain" animate={reducedMotion ? undefined : { scale: readingMode === mode ? 1.05 : 0.9 }} />
              <span className="relative">{t(mode === "mission" ? "app.modes.mission" : "scientificHeader.steam")}</span>
            </motion.button>)}
          </div>
        </LayoutGroup>
        <div className="flex items-center gap-2">
          <div ref={languageRoot} className="relative">
            <motion.button ref={languageTrigger} type="button" aria-label={t("app.languageLabel")} aria-haspopup="menu" aria-expanded={languageOpen} aria-controls={languageOpen ? menuId : undefined} onClick={() => setLanguageOpen((open) => !open)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setLanguageOpen(true); } }} whileTap={reducedMotion ? undefined : { scale: 0.94 }} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-elevated px-3 text-xs font-bold text-content shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Languages className="h-4 w-4" aria-hidden="true" /><span>{locale.toUpperCase()}</span>
            </motion.button>
            <AnimatePresence>{languageOpen && <motion.div id={menuId} ref={menuRef} role="menu" aria-label={t("app.languageLabel")} initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: -4 }} onKeyDown={(event) => {
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
              const index = items.findIndex((item) => item === document.activeElement);
              const next = event.key === "ArrowDown" ? (index + 1) % items.length : event.key === "ArrowUp" ? (index - 1 + items.length) % items.length : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
              if (next !== null) { event.preventDefault(); items[next]?.focus(); }
            }} className="absolute right-0 top-full z-50 mt-2 w-44 origin-top-right rounded-2xl border border-border-subtle bg-surface-elevated p-2 shadow-elevated">
              {LOCALES.map((lang) => <button key={lang} type="button" role="menuitemradio" aria-checked={locale === lang} onClick={() => { void i18n.changeLanguage(lang); setLanguageOpen(false); languageTrigger.current?.focus(); }} className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${locale === lang ? "bg-accent/15 text-accent" : "text-content hover:bg-surface-muted"}`}>{t(`scientificHeader.languages.${lang}`)}</button>)}
            </motion.div>}</AnimatePresence>
          </div>
          <button type="button" role="switch" aria-checked={theme === "dark"} onClick={onToggleTheme} aria-label={t(theme === "dark" ? "app.themeLight" : "app.themeDark")} className="relative flex h-12 w-24 shrink-0 items-center justify-between rounded-full border border-border-subtle bg-surface-muted/70 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className={`pointer-events-none absolute inset-1 flex ${theme === "dark" ? "justify-end" : "justify-start"}`}><motion.span layout className="h-full w-10 rounded-full border border-accent/50 bg-accent/20 shadow-sm" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 25 }} /></span>
            <img src="/img/science-accessories/ckepi-icon-solar.webp" alt="" width={36} height={36} className="relative h-8 w-8 object-contain" />
            <img src="/img/planets/ckepi-planet-moon.webp" alt="" width={36} height={36} className="relative h-8 w-8 object-contain" />
          </button>
        </div>
      </div>
    </header>
  );
}
