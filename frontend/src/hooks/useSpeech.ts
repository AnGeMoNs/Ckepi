import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const VOICE_LANG: Record<string, string> = { es: "es-CL", pt: "pt-BR", en: "en-US" };

/**
 * Read-aloud with the Web Speech API. Voices depend on the browser and the operating system,
 * so `available` can be false: the visible text always says the same thing.
 */
export function useSpeech() {
  const { i18n } = useTranslation();
  const available = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (available) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [available]);

  const speak = useCallback(
    (text: string) => {
      if (!available) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = VOICE_LANG[i18n.language.slice(0, 2)] ?? "es-CL";
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    },
    [available, i18n.language]
  );

  // Never keep talking after the component that started the voice is gone.
  useEffect(() => stop, [stop]);

  return { available, speaking, speak, stop };
}
