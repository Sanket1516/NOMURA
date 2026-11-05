"use client";
import { useEffect, useState } from "react";
import { CloudDownload, Trash2 } from "lucide-react";
import type { Lang } from "@/lib/types";
import { tr, trf } from "@/lib/i18n/pages";

export const LESSON_CACHE = "vaakya-lessons-v1";   // same name as in public/sw.js

/** Saves the public lesson pages in this browser so they open without a connection. Only pages that contain lesson text and nothing
 *  personal are stored (checked by the `data-lesson-content` marker), and only when the person presses the button. */
export function SaveOffline({ ids, lang }: { ids: string[]; lang: Lang }) {
  const [saved, setSaved] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);   // decided after mount, so server and first client render match (no hydration mismatch)

  useEffect(() => {
    if (!("caches" in window)) return;
    setSupported(true);
    // `caches.open` would create the cache; check first so that nothing is stored until the person presses Save.
    caches.has(LESSON_CACHE).then((has) => (has ? caches.open(LESSON_CACHE).then((c) => c.keys()) : [])).then((k) => setSaved(k.filter((r) => /\/lessons\/[^/]+$/.test(new URL(r.url).pathname)).length)).catch(() => {});
  }, []);

  if (!supported) return null;

  async function save() {
    setBusy(true); setMsg("");
    try {
      const cache = await caches.open(LESSON_CACHE);
      let n = 0;
      for (const url of ["/lessons", ...ids.map((id) => `/lessons/${encodeURIComponent(id)}`)]) {
        const res = await fetch(url);
        const html = res.ok ? await res.clone().text() : "";
        if (html.includes('data-lesson-content="true"')) { await cache.put(url, res); if (url !== "/lessons") n++; }
      }
      setSaved(n);
      setMsg(n ? trf(lang, "ls.saved", { n }) : tr(lang, "ls.failed"));
    } catch { setMsg(tr(lang, "ls.failed")); }
    setBusy(false);
  }
  async function remove() {
    await caches.delete(LESSON_CACHE);
    setSaved(0); setMsg(tr(lang, "ls.removed"));
  }

  return (
    <section aria-labelledby="offl-h" className="mt-6 rounded-2xl border border-line bg-surface p-5">
      <h2 id="offl-h" className="font-display text-xl">{tr(lang, "ls.title")}</h2>
      <p className="mt-1 text-sm text-ink-2">{tr(lang, "ls.body")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-semibold text-white disabled:opacity-60">
          <CloudDownload aria-hidden className="size-4" />{tr(lang, "ls.save")}
        </button>
        {saved ? (
          <button type="button" onClick={remove} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold ring-1 ring-line">
            <Trash2 aria-hidden className="size-4" />{tr(lang, "ls.remove")}
          </button>
        ) : null}
      </div>
      <p role="status" className="mt-2 text-sm text-ink-2">{msg}</p>
    </section>
  );
}
