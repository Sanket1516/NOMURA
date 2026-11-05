import type { Metadata } from "next";
import { loadDashboard } from "@/lib/server/data";
import { getViewer } from "@/lib/server/session";
import { Chat } from "./chat";

export const metadata: Metadata = { title: "Ask VAAKYA" };

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ agent?: string; q?: string }> }) {
  const d = await loadDashboard();
  const viewer = await getViewer();
  const { agent, q } = await searchParams;
  return <Chat name={d.profile.display_name} lang={d.profile.preferred_lang} preview={viewer?.mode === "preview"} initialAgent={agent} initialQuestion={q} />;
}
