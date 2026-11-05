import type { Metadata } from "next";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { VoiceCompanion } from "./voice-companion";

export const metadata: Metadata = { title: "Voice" };

export default async function VoicePage() {
  const d = await loadDashboard();
  const ui = await uiLang();
  return <VoiceCompanion ui={ui} lang={d.profile.preferred_lang} name={d.profile.display_name} />;
}
