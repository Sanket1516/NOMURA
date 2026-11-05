import type { Metadata } from "next";
import { Steps, ONBOARDING_STEPS } from "@/components/layout/steps";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Consent" };

export default function ConsentPage() {
  return (
    <>
      <Steps current={1} labels={ONBOARDING_STEPS} />
      <h1 className="font-display text-4xl">Your data, your choice</h1>
      <p className="mt-2 text-ink-2">Each permission is separate. You can view or withdraw any of them later in Profile. VAAKYA processes your data on its own server and does not sell or share it.</p>
      <ConsentForm />
    </>
  );
}
