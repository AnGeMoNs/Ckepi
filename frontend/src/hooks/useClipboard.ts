import { useCallback, useEffect, useRef, useState } from "react";

/** Report success only after the browser accepts the text, and clean up feedback timers. */
export function useClipboard() {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current += 1;
    clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string) => {
    const request = ++generation.current;
    clearTimeout(timer.current);
    setStatus("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (request !== generation.current) return;
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      if (request === generation.current) setStatus("error");
    }
  }, []);

  return { status, copy };
}
