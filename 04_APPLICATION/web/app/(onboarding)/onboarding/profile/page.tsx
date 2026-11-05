import type { Metadata } from "next";
import { Steps, ONBOARDING_STEPS } from "@/components/layout/steps";
import { isPersona } from "@/lib/demo";
import { ProfileWizard } from "./profile-wizard";

export const metadata: Metadata = { title: "About you" };

export default async function ProfileStep({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const { persona } = await searchParams;
  return (
    <>
      <Steps current={3} labels={ONBOARDING_STEPS} />
      <ProfileWizard persona={isPersona(persona) ? persona : null} />
    </>
  );
}
