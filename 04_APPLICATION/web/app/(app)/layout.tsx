import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { getViewer } from "@/lib/server/session";
import { ErrorPanel } from "@/components/layout/error-panel";
import { ApiError } from "@/lib/server/api";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const lang = await uiLang();
  try {
    const d = await loadDashboard();
    return (
      <AppShell name={d.profile.display_name} lang={lang} origin={d.origin} unread={d.notifications.filter((n) => !n.read).length}
        previewPersona={viewer?.mode === "preview" ? d.profile.display_name : undefined}>
        {children}
      </AppShell>
    );
  } catch (e) {
    // The API answers 409 with next=/onboarding until consent, profile and money questions are done.
    if (e instanceof ApiError && e.problem.status === 409) redirect((e.problem as { next?: string }).next ?? "/onboarding");
    if (e instanceof ApiError && e.problem.status === 401) redirect("/login");
    if (e instanceof ApiError) return <main id="main" className="mx-auto max-w-xl p-6"><ErrorPanel problem={e.problem} /></main>;
    throw e;
  }
}
