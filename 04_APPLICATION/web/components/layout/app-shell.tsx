"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DataOrigin, Lang } from "@/lib/types";
import { NAV_LABELS } from "@/lib/i18n/nav";
import { BOTTOM, NAV, SECONDARY } from "./nav-items";
import { Wordmark } from "./logo";

const ALL = [...NAV, ...SECONDARY];

export function AppShell({ children, name, lang, origin, unread, previewPersona }: {
  children: ReactNode; name: string; lang: Lang; origin: DataOrigin; unread: number; previewPersona?: string;
}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const label = (k: string) => NAV_LABELS[k]?.[lang] ?? k;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLink = (item: (typeof ALL)[number], onClick?: () => void) => (
    <Link key={item.key} href={item.href} onClick={onClick} aria-current={isActive(item.href) ? "page" : undefined}
      className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors",
        isActive(item.href) ? "bg-primary-soft text-primary" : "text-ink-2 hover:bg-surface-2 hover:text-ink")}>
      <item.Icon aria-hidden className="lit-icon size-5" />
      {label(item.key)}
      {item.key === "notifications" && unread > 0 ? <span className="ml-auto rounded-full bg-danger px-2 text-xs font-bold text-white">{unread}<span className="sr-only"> unread</span></span> : null}
    </Link>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Link href="/home" className="px-2" aria-label="VAAKYA home"><Wordmark /></Link>
        <nav aria-label="Main" className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map((i) => navLink(i))}
          <div className="my-3 border-t border-line" />
          {SECONDARY.map((i) => navLink(i))}
        </nav>
        <form action="/api/auth/logout" method="post">
          <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-ink-2 hover:bg-surface-2"><LogOut aria-hidden className="size-5" />Sign out</button>
        </form>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {previewPersona ? (
          <div className="bg-demo text-white">
            <p className="mx-auto max-w-6xl px-4 py-2 text-sm">
              <strong>Preview with sample data.</strong> You are viewing {previewPersona}&apos;s synthetic example. Nothing is saved and AI agents are not connected.{" "}
              <Link href="/login" className="font-semibold underline">Sign in for the real service</Link>
            </p>
          </div>
        ) : null}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-surface-2 lg:hidden" aria-label="Open menu" aria-haspopup="dialog"
              onClick={() => dialog.current?.showModal()}><Menu aria-hidden /></button>
            <Link href="/home" className="lg:hidden" aria-label="VAAKYA home"><Wordmark /></Link>
            <span className="hidden lg:block" />
            <div className="flex items-center gap-1">
              <Link href="/notifications" className="relative grid size-11 place-items-center rounded-full hover:bg-surface-2"
                aria-label={`${label("notifications")}${unread ? `, ${unread} unread` : ""}`}>
                <Bell aria-hidden className="size-5" />
                {unread ? <span aria-hidden className="absolute right-2 top-2 size-2.5 rounded-full bg-danger ring-2 ring-paper" /> : null}
              </Link>
              <Link href="/profile" className="grid size-11 place-items-center rounded-full bg-ink font-display text-lg text-paper" aria-label={`${label("profile")}: ${name}`}>
                {name.slice(0, 1)}
              </Link>
            </div>
          </div>
        </header>

        <dialog ref={dialog} aria-label="Menu" className="m-0 h-dvh max-h-dvh w-[86vw] max-w-sm bg-surface p-0 text-ink backdrop:bg-ink/40">
          <div className="flex items-center justify-between border-b border-line p-4">
            <Wordmark />
            <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Close menu" onClick={() => dialog.current?.close()}><X aria-hidden /></button>
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1 p-3">
            {ALL.map((i) => navLink(i, () => dialog.current?.close()))}
            <form action="/api/auth/logout" method="post" className="mt-2 border-t border-line pt-2">
              <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-ink-2 hover:bg-surface-2"><LogOut aria-hidden className="size-5" />Sign out</button>
            </form>
          </nav>
        </dialog>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:pb-12">{children}</main>

        {/* Mobile bottom navigation */}
        <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {BOTTOM.map((k) => {
              const item = ALL.find((i) => i.key === k)!;
              const active = isActive(item.href);
              return (
                <li key={k}>
                  <Link href={item.href} aria-current={active ? "page" : undefined}
                    className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold", active ? "text-primary" : "text-ink-3")}>
                    <item.Icon aria-hidden className={cn("lit-icon size-5", active && "stroke-[2.4]")} />
                    {label(k)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
