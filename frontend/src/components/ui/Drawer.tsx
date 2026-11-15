import { useEffect, useId, useRef, type ReactNode } from "react";

import { Pictogram } from "../worlds/Pictograms";

interface DrawerProps {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** "side" slides in from the edge; "center" is a liquid-glass dialog in the middle of the screen. */
  variant?: "side" | "center";
}

export function Drawer({ open, title, closeLabel, onClose, children, variant = "side" }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!dialog.open && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    } else if (dialog.open && typeof dialog.close === "function") {
      dialog.close();
      previousFocusRef.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className={
        variant === "center"
          ? "ckepi-liquid ckepi-dialog-center m-auto max-h-[88dvh] w-[min(56rem,calc(100%-1.5rem))] rounded-3xl p-0 text-content backdrop:bg-ckepi-space/70 backdrop:backdrop-blur-md open:flex open:flex-col"
          : "m-0 ml-auto h-dvh max-h-dvh w-full max-w-md border-l border-border-subtle bg-surface-elevated p-0 text-content shadow-elevated backdrop:bg-surface/75 backdrop:backdrop-blur-sm open:flex open:flex-col"
      }
    >
      <div className={`flex items-center justify-between border-b border-border-subtle ${variant === "center" ? "px-5 py-4 sm:px-6" : "px-4 py-3"}`}>
        <h2 id={titleId} className={variant === "center" ? "text-lg font-bold text-content sm:text-xl" : "text-base font-semibold text-content"}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pictogram name="close" className="h-6 w-6" />
        </button>
      </div>
      <div className={`flex-1 overflow-y-auto ${variant === "center" ? "p-4 sm:p-6" : "p-4"}`}>{children}</div>
    </dialog>
  );
}
