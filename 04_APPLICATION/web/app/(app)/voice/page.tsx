import type { Metadata } from "next";
import { loadDashboard } from "@/lib/server/data";
import { VoiceCompanion } from "./voice-companion";

export const metadata: Metadata = { title: "Voice" };

export default async function VoicePage() {
  const d = await loadDashboard();
  return <VoiceCompanion lang={d.profile.preferred_lang} name={d.profile.display_name} />;
}
