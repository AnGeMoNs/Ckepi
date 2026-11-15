import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { HexField } from "./HexField";

const REVEAL_MS = 1100;

/**
 * Entering the software from the presentation: the hex grid that closed the home
 * intro covers the screen and then flies out in a wave, uncovering the app.
 */
export function HexReveal({ onDone }: { onDone: () => void }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [state, setState] = useState<"idle" | "exit">("idle");
  // Keep the latest callback without restarting the timers on parent re-renders.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const start = window.setTimeout(() => setState("exit"), 60);
    const done = window.setTimeout(() => onDoneRef.current(), reduceMotion ? 200 : REVEAL_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(done);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
      <HexField state={state} reduceMotion={reduceMotion} revealBase />
    </div>
  );
}
