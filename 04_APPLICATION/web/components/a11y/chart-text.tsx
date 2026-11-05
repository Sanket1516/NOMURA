import type { ReactNode } from "react";
import type { Lang } from "@/lib/types";
import { tr } from "@/lib/i18n/pages";

/**
 * Accessible chart wrapper (FR-A11-02). The visual is aria-hidden; the summary is the figure's caption,
 * and a data table is available to screen readers and to sighted users on demand.
 */
export function ChartText({ summary, columns, rows, children, tableLabel, lang = "en" }: {
  lang?: Lang; summary: string; columns: string[]; rows: (string | number)[][]; children: ReactNode; tableLabel: string;
}) {
  return (
    <figure className="m-0">
      <div aria-hidden>{children}</div>
      <figcaption className="mt-2 text-sm text-ink-2">{summary}</figcaption>
      <details className="mt-1 text-sm">
        <summary className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline">{tr(lang, "sh.showtable")}</summary>
        <table className="mt-2 w-full text-left tabular">
          <caption className="sr-only">{tableLabel}</caption>
          <thead><tr>{columns.map((c) => <th key={c} scope="col" className="border-b border-line py-1 pr-3 font-semibold">{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="py-1 pr-3 font-normal">{c}</th> : <td key={j} className="py-1 pr-3">{c}</td>)}</tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
