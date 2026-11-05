import { ExternalLink } from "lucide-react";
import type { Citation, Lang } from "@/lib/types";
import { tr } from "@/lib/i18n/pages";

export function Citations({ items, lang = "en" }: { items: Citation[]; lang?: Lang }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{tr(lang, "sh.sources")}</p>
      <ol className="mt-1 space-y-1 text-sm">
        {items.map((c, i) => (
          <li key={c.id} className="flex gap-2">
            <span className="tabular text-ink-3">[{i + 1}]</span>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {c.title}<span className="text-ink-3"> · {c.publisher}{c.effective_date ? `, ${c.effective_date}` : ""}</span>
              <ExternalLink aria-hidden className="ml-1 inline size-3.5" /><span className="sr-only">{tr(lang, "sh.newtab")}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AiNotice({ text, lang = "en" }: { text?: string; lang?: Lang }) {
  return <p className="mt-2 text-xs text-ink-3">{text ?? tr(lang, "sh.ainotice")}</p>;
}
