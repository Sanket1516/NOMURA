"use client";
import { usePreferences, type Preferences } from "@/components/a11y/preferences";
import { useAnnounce } from "@/components/a11y/live-region";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/types";
import { tr, type PageKey } from "@/lib/i18n/pages";

const SIZES: Preferences["textScale"][] = [1, 1.125, 1.25, 1.5];
const THEMES: Preferences["theme"][] = ["system", "light", "dark"];

function Choice<T extends string | number>({ legend, value, options, onChange }: { legend: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={String(o.v)} className={cn("flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus",
            value === o.v ? "border-ink bg-ink text-paper" : "border-line bg-surface")}>
            <input type="radio" className="sr-only" name={legend} checked={value === o.v} onChange={() => onChange(o.v)} />{o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AccessibilitySettings({ lang = "en" }: { lang?: Lang }) {
  const t = (k: PageKey) => tr(lang, k);
  const sizes = SIZES.map((v) => ({ v, label: t(`a11y.size.${v}` as PageKey) }));
  const themes = THEMES.map((v) => ({ v, label: t(`a11y.theme.${v}` as PageKey) }));
  const onoff = (b: boolean) => t(b ? "a11y.on" : "a11y.off");
  const { prefs, update, reset } = usePreferences();
  const announce = useAnnounce();
  const set = (patch: Partial<Preferences>, msg: string) => { update(patch); announce(msg); };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card aria-labelledby="vis-h">
        <CardHeader id="vis-h" eyebrow={t("a11y.seeing")} title={t("a11y.textcolour")} />
        <div className="space-y-6">
          <Choice legend={t("a11y.textsize")} value={prefs.textScale} options={sizes} onChange={(v) => set({ textScale: v }, `${t("a11y.textsize")} ${sizes.find((s) => s.v === v)?.label}`)} />
          <Choice legend={t("a11y.theme")} value={prefs.theme} options={themes} onChange={(v) => set({ theme: v }, `${t("a11y.theme")} ${themes.find((s) => s.v === v)?.label}`)} />
          <Switch label={t("a11y.contrast")} description={t("a11y.contrast.d")} checked={prefs.contrast === "high"} onChange={(v) => set({ contrast: v ? "high" : "normal" }, `${t("a11y.contrast")} ${onoff(v)}`)} />
          <p className="rounded-xl bg-surface-2 p-4" aria-hidden>{t("a11y.preview")}</p>
        </div>
      </Card>
      <Card aria-labelledby="int-h">
        <CardHeader id="int-h" eyebrow={t("a11y.using")} title={t("a11y.motionvoice")} />
        <div className="divide-y divide-line">
          <Switch label={t("a11y.motion")} description={t("a11y.motion.d")} checked={prefs.reducedMotion} onChange={(v) => set({ reducedMotion: v }, `${t("a11y.motion")} ${onoff(v)}`)} />
          <Switch label={t("a11y.voice")} description={t("a11y.voice.d")} checked={prefs.voiceFirst} onChange={(v) => set({ voiceFirst: v }, `${t("a11y.voice")} ${onoff(v)}`)} />
          <Switch label={t("a11y.simple")} description={t("a11y.simple.d")} checked={prefs.lowLiteracy} onChange={(v) => set({ lowLiteracy: v }, `${t("a11y.simple")} ${onoff(v)}`)} />
        </div>
        <Button variant="secondary" className="mt-5" onClick={() => { reset(); announce(t("a11y.reset.msg")); }}>{t("a11y.reset")}</Button>
      </Card>
      <Card className="lg:col-span-2" aria-labelledby="kb-h">
        <CardHeader id="kb-h" eyebrow={t("a11y.kb.eyebrow")} title={t("a11y.kb.title")} />
        <ul className="grid gap-2 text-ink-2 sm:grid-cols-2">
          <li><kbd className="rounded bg-surface-2 px-1.5">Tab</kbd> {t("a11y.kb.1")}</li>
          <li>{t("a11y.kb.2")}</li>
          <li>{t("a11y.kb.3")}</li>
          <li>{t("a11y.kb.4a")} <kbd className="rounded bg-surface-2 px-1.5">Enter</kbd> {t("a11y.kb.4b")} <kbd className="rounded bg-surface-2 px-1.5">Shift + Enter</kbd> {t("a11y.kb.4c")}</li>
        </ul>
      </Card>
    </div>
  );
}
