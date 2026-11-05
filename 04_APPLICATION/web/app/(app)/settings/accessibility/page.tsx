import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AccessibilitySettings } from "./settings";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader title="Accessibility" description="Changes apply immediately and are remembered on this device. VAAKYA also works with TalkBack, VoiceOver and NVDA." />
      <AccessibilitySettings />
    </>
  );
}
