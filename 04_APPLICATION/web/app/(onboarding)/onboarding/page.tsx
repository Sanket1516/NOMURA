import type { Metadata } from "next";
import { Steps, ONBOARDING_STEPS } from "@/components/layout/steps";
import { uiLang } from "@/lib/server/data";
import { tr } from "@/lib/i18n/pages";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Consent" };

export default async function ConsentPage() {
  const lang = await uiLang();
  return (
    <>
      <Steps current={1} labels={ONBOARDING_STEPS} lang={lang} />
      <h1 className="font-display text-4xl">{tr(lang, "onb.consent.title")}</h1>
      <p className="mt-2 text-ink-2">{tr(lang, "onb.consent.intro")}</p>
      <ConsentForm lang={lang} />
    </>
  );
}
