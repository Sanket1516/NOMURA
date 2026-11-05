"use client";
import { useCallback, useRef, useState } from "react";

/** Records audio with MediaRecorder. Audio goes only to VAAKYA's server, never to a browser speech service. */
export function useRecorder(maxSeconds = 60) {
  const [state, setState] = useState<"idle" | "recording" | "denied" | "unsupported">("idle");
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolver = useRef<((b: Blob | null) => void) | null>(null);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setState("unsupported"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        resolver.current?.(chunks.current.length ? new Blob(chunks.current, { type: r.mimeType || "audio/webm" }) : null);
        resolver.current = null;
        setState("idle");
      };
      rec.current = r;
      r.start();
      setState("recording");
      timer.current = setTimeout(() => r.state === "recording" && r.stop(), maxSeconds * 1000);
    } catch {
      setState("denied");
    }
  }, [maxSeconds]);

  const stop = useCallback(() => new Promise<Blob | null>((resolve) => {
    if (timer.current) clearTimeout(timer.current);
    if (!rec.current || rec.current.state !== "recording") { resolve(null); return; }
    resolver.current = resolve;
    rec.current.stop();
  }), []);

  return { state, start, stop };
}
