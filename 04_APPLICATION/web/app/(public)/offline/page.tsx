import { uiLang } from "@/lib/server/data";
import { tr } from "@/lib/i18n/pages";

export const metadata = { title: "Offline" };
export default async function Offline() {
  const lang = await uiLang();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl">{tr(lang, "off.title")}</h1>
      <p className="mt-3 text-ink-2">{tr(lang, "off.body")}</p>
    </div>
  );
}
