"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import type { Lang } from "@/lib/types";
import { tr } from "@/lib/i18n/pages";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Shows only when the browser says the app can be installed (Chromium fires `beforeinstallprompt`). Nothing is shown otherwise,
 *  so there is no dead button on Safari or Firefox. */
export function InstallButton({ lang }: { lang: Lang }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const onInstalled = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (!evt) return null;
  return (
    <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-surface-2" aria-label={tr(lang, "shell.install")} title={tr(lang, "shell.install")}
      onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null); }}>
      <Download aria-hidden className="size-5" />
    </button>
  );
}
