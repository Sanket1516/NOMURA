import type { Metadata } from "next";
import { uiLang } from "@/lib/server/data";
import { PageHeader } from "@/components/layout/page-header";
import { AccessibilitySettings } from "./settings";

export const metadata: Metadata = { title: "Accessibility" };

export default async function AccessibilityPage() {
  const lang = await uiLang();
  return (
    <>
      <PageHeader tk="accessibility" title="Accessibility" description="Changes apply immediately and are remembered on this device. VAAKYA also works with TalkBack, VoiceOver and NVDA." />
      <AccessibilitySettings lang={lang} />
    </>
  );
}
