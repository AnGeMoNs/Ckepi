import { HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  text: string;
  label: string;
}

export function InfoTooltip({ text, label }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-content-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-1.5 w-64 -translate-x-1/2 rounded border border-border-subtle bg-surface-elevated p-2.5 text-left text-xs font-normal leading-relaxed text-content sm:w-72"
        >
          {text}
        </span>
      )}
    </span>
  );
}

