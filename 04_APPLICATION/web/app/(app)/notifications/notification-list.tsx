"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell, BookOpen, CalendarCheck, Landmark, ShieldAlert, Target } from "lucide-react";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Lang, Notification } from "@/lib/types";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

const ICON = { goal: Target, scheme: Landmark, scam: ShieldAlert, learning: BookOpen, review: CalendarCheck, system: Bell };

export function NotificationList({ items, lang = "en" }: { items: Notification[]; lang?: Lang }) {
  const t = (k: PageKey) => tr(lang, k);
  const [list, setList] = useState(items);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown = list.filter((n) => filter === "all" || !n.read);
  const markRead = (id: string) => {
    setList((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void api(`/v1/notifications/${id}/read`, { method: "POST", json: {} }); // best effort; ignored in preview
  };
  return (
    <div>
      <div role="group" aria-label={t("notif.filter")} className="mb-4 flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
            className={cn("min-h-11 rounded-full px-4 text-sm font-semibold", filter === f ? "bg-ink text-paper" : "bg-surface-2 text-ink-2")}>
            {f === "all" ? t("notif.all") : trf(lang, "notif.unread", { n: list.filter((n) => !n.read).length })}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {shown.map((n) => {
            const Icon = ICON[n.kind];
            return (
              <li key={n.id} className={cn("flex gap-4 p-4", !n.read && "bg-primary-soft/40")}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2"><Icon aria-hidden className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{!n.read ? <span className="sr-only">{t("notif.unread.sr")}</span> : null}{n.href ? <Link href={n.href} onClick={() => markRead(n.id)} className="hover:underline">{n.title}</Link> : n.title}</p>
                  <p className="text-sm text-ink-2">{n.body}</p>
                  <time className="text-xs text-ink-3" dateTime={n.at}>{formatDate(n.at)}</time>
                </div>
                {!n.read ? <button type="button" onClick={() => markRead(n.id)} className="min-h-11 self-center rounded-full px-3 text-sm font-semibold text-primary hover:bg-surface-2">{t("notif.markread")}<span className="sr-only">: {n.title}</span></button> : null}
              </li>
            );
          })}
        </ul>
      ) : <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-2">{t("notif.empty")}</p>}
    </div>
  );
}
