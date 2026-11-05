import type { ReactNode } from "react";
import type { DataOrigin } from "@/lib/types";
import { OriginBadge } from "@/components/ai/origin-badge";
import { tr, type HeaderKey, type PageKey } from "@/lib/i18n/pages";
import { uiLang } from "@/lib/server/data";

/**
 * `tk` selects a translated title and description (hi, mr, kn are drafts pending native review).
 * Pass `description` too when it is built from live numbers: it is kept as given, in English.
 */
export async function PageHeader({ tk, title, description, origin, eyebrow, action }: {
  tk?: HeaderKey; title?: ReactNode; description?: ReactNode; origin?: DataOrigin; eyebrow?: ReactNode; action?: ReactNode;
}) {
  const lang = await uiLang();
  const translated = tk !== undefined && lang !== "en";
  const heading = translated ? tr(lang, `${tk}.title` as PageKey) : title;
  const sub = translated ? (description && tk === "learn" ? description : tr(lang, `${tk}.desc` as PageKey)) : description;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-sm font-semibold text-primary">{eyebrow}</p> : null}
        <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight text-ink sm:text-[2.4rem]">{heading}</h1>
        {sub ? <p className="mt-2 text-ink-2">{sub}</p> : null}
        {translated ? <p className="mt-2 text-xs text-ink-3">{tr(lang, "draft.notice")}</p> : null}
      </div>
      <div className="flex items-center gap-2">{origin ? <OriginBadge origin={origin} lang={lang} /> : null}{action}</div>
    </div>
  );
}
