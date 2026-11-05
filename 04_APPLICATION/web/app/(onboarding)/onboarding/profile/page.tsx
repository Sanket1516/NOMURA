import type { Metadata } from "next";
import { Steps, ONBOARDING_STEPS } from "@/components/layout/steps";
import { isPersona } from "@/lib/demo";
import { uiLang } from "@/lib/server/data";
import { ProfileWizard } from "./profile-wizard";

export const metadata: Metadata = { title: "About you" };

export default async function ProfileStep({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const { persona } = await searchParams;
  const lang = await uiLang();
  return (
    <>
      <Steps current={3} labels={ONBOARDING_STEPS} lang={lang} />
      <ProfileWizard persona={isPersona(persona) ? persona : null} ui={lang} />
    </>
  );
}
