"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface Preferences {
  textScale: 1 | 1.125 | 1.25 | 1.5;
  contrast: "normal" | "high";
  theme: "system" | "light" | "dark";
  reducedMotion: boolean;
  voiceFirst: boolean;
  lowLiteracy: boolean;
}

export const DEFAULT_PREFS: Preferences = { textScale: 1, contrast: "normal", theme: "system", reducedMotion: false, voiceFirst: false, lowLiteracy: false };
const KEY = "vaakya.prefs.v1";

export function applyPrefs(p: Preferences) {
  const r = document.documentElement;
  r.style.setProperty("--text-scale", String(p.textScale));
  r.dataset.contrast = p.contrast;
  if (p.theme === "system") delete r.dataset.theme; else r.dataset.theme = p.theme;
  if (p.reducedMotion) r.dataset.motion = "reduce"; else delete r.dataset.motion;
  r.dataset.literacy = p.lowLiteracy ? "low" : "standard";
}

/** Inline script for <head>: applies saved preferences before first paint (no flash). */
export const PREFS_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"null");if(p){var r=document.documentElement;r.style.setProperty("--text-scale",String(p.textScale||1));r.dataset.contrast=p.contrast||"normal";if(p.theme&&p.theme!=="system")r.dataset.theme=p.theme;if(p.reducedMotion)r.dataset.motion="reduce";r.dataset.literacy=p.lowLiteracy?"low":"standard";}}catch(e){}`;

const Ctx = createContext<{ prefs: Preferences; update: (patch: Partial<Preferences>) => void; reset: () => void }>({
  prefs: DEFAULT_PREFS, update: () => {}, reset: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...saved });
    } catch { /* storage unavailable: defaults */ }
  }, []);
  const persist = useCallback((p: Preferences) => {
    setPrefs(p);
    applyPrefs(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  }, []);
  return (
    <Ctx.Provider value={{ prefs, update: (patch) => persist({ ...prefs, ...patch }), reset: () => persist(DEFAULT_PREFS) }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePreferences = () => useContext(Ctx);
