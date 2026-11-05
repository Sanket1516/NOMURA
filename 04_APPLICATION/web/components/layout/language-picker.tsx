"use client";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LANG_NAMES } from "@/lib/i18n/nav";
import type { Lang } from "@/lib/types";

export function LanguagePicker({ current }: { current: Lang }) {
  const router = useRouter();
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-full px-3 ring-1 ring-line">
      <Languages aria-hidden className="size-4 text-ink-2" />
      <span className="sr-only">Language</span>
      <select value={current} className="bg-transparent py-2 text-sm font-semibold"
        onChange={(e) => { document.cookie = `vaakya_lang=${e.target.value}; path=/; max-age=31536000; samesite=lax`; router.refresh(); }}>
        {(Object.keys(LANG_NAMES) as Lang[]).map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
      </select>
    </label>
  );
}
