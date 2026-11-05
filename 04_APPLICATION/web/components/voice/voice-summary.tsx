"use client";
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/components/a11y/live-region";

/**
 * Voice Summary (FR-VOI-06). Uses only on-device browser voices (localService), so no audio leaves the device.
 * If none exists, the summary goes to the screen-reader live region instead.
 */
export function VoiceSummary({ text, label = "Listen to a summary", server = false, lang = "en" }: { text: string; label?: string; server?: boolean; lang?: string }) {
  const announce = useAnnounce();
  const [speaking, setSpeaking] = useState(false);
  async function speakServer(): Promise<boolean> {
    try {
      const r = await fetch("/api/proxy/v1/voice/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) });
      if (!r.ok) return false;
      const { url } = await r.json();
      const audio = new Audio(`/api/proxy${url}`);
      audio.onended = () => setSpeaking(false);
      setSpeaking(true);
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }
  async function speak() {
    if (server && !speaking && (await speakServer())) return;
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
    <Button type="button" variant="secondary" size="sm" onClick={() => void speak()} aria-pressed={speaking}>
      {speaking ? <VolumeX aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-4" />}{speaking ? "Stop" : label}
    </Button>
  );
}
