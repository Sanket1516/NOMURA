"use client";
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/components/a11y/live-region";

/**
 * Voice Summary (FR-VOI-06). Uses only on-device browser voices (localService), so no audio leaves the device.
 * If none exists, the summary goes to the screen-reader live region instead.
 */
export function VoiceSummary({ text, label = "Listen to a summary" }: { text: string; label?: string }) {
  const announce = useAnnounce();
  const [speaking, setSpeaking] = useState(false);
  function speak() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (speaking && synth) { synth.cancel(); setSpeaking(false); return; }
    const voice = synth?.getVoices().find((v) => v.localService && v.lang.startsWith("en"));
    if (!synth || !voice) { announce(text); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }
  return (
    <Button type="button" variant="secondary" size="sm" onClick={speak} aria-pressed={speaking}>
      {speaking ? <VolumeX aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-4" />}{speaking ? "Stop" : label}
    </Button>
  );
}
