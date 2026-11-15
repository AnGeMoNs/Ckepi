import { Pictogram } from "../worlds/Pictograms";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  text: string;
  label: string;
}

interface PopoverCoords {
  top: number;
  left: number;
}

export function InfoTooltip({ text, label }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    const tip = tipRef.current;
    if (!btn || !tip) return;

    const margin = 8;
    const gap = 6;
    const btnRect = btn.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer above; flip below if not enough room above
    let top = btnRect.top - tipRect.height - gap;
    if (top < margin) {
      top = Math.min(vh - tipRect.height - margin, btnRect.bottom + gap);
    }

    // Center horizontally on button, clamped inside viewport
    let left = btnRect.left + btnRect.width / 2 - tipRect.width / 2;
    left = Math.max(margin, Math.min(vw - tipRect.width - margin, left));

    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    const tip = tipRef.current as (HTMLSpanElement & {
      showPopover?: () => void;
      hidePopover?: () => void;
    }) | null;
    if (!tip) return;

    if (!tip.hasAttribute("popover")) {
      tip.setAttribute("popover", "manual");
    }

    if (open) {
      if (typeof tip.showPopover === "function") {
        try {
          tip.showPopover();
        } catch {
          // Ignore if already open or unsupported
        }
      }
      updatePosition();
    } else if (typeof tip.hidePopover === "function") {
      try {
        tip.hidePopover();
      } catch {
        // Ignore if already hidden
      }
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!tipRef.current || !tipRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
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
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-content-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Pictogram name="info" className="h-5 w-5" />
      </button>

      <span
        ref={tipRef}
        id={tooltipId}
        role="tooltip"
        style={
          coords
            ? { top: `${coords.top}px`, left: `${coords.left}px`, position: "fixed" }
            : undefined
        }
        className={`m-0 w-60 max-w-[calc(100vw-1rem)] rounded-lg border border-border-subtle bg-surface-elevated p-2.5 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-content shadow-elevated sm:w-72 ${
          open ? "block" : "hidden"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
