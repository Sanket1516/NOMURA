"use client";
import { usePreferences, type Preferences } from "@/components/a11y/preferences";
import { useAnnounce } from "@/components/a11y/live-region";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const SIZES: { v: Preferences["textScale"]; label: string }[] = [{ v: 1, label: "Default" }, { v: 1.125, label: "Large" }, { v: 1.25, label: "Larger" }, { v: 1.5, label: "Largest" }];
const THEMES: { v: Preferences["theme"]; label: string }[] = [{ v: "system", label: "Match device" }, { v: "light", label: "Light" }, { v: "dark", label: "Dark" }];

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

export function AccessibilitySettings() {
  const { prefs, update, reset } = usePreferences();
  const announce = useAnnounce();
  const set = (patch: Partial<Preferences>, msg: string) => { update(patch); announce(msg); };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card aria-labelledby="vis-h">
        <CardHeader id="vis-h" eyebrow="Seeing" title="Text and colour" />
        <div className="space-y-6">
          <Choice legend="Text size" value={prefs.textScale} options={SIZES} onChange={(v) => set({ textScale: v }, `Text size ${SIZES.find((s) => s.v === v)?.label}`)} />
          <Choice legend="Theme" value={prefs.theme} options={THEMES} onChange={(v) => set({ theme: v }, `Theme ${v}`)} />
          <Switch label="High contrast" description="Black on white with strong outlines and focus." checked={prefs.contrast === "high"} onChange={(v) => set({ contrast: v ? "high" : "normal" }, `High contrast ${v ? "on" : "off"}`)} />
          <p className="rounded-xl bg-surface-2 p-4" aria-hidden>Preview: Your emergency fund is <strong>₹42,000</strong> of ₹1,56,000.</p>
        </div>
      </Card>
      <Card aria-labelledby="int-h">
        <CardHeader id="int-h" eyebrow="Using" title="Motion, voice and words" />
        <div className="divide-y divide-line">
          <Switch label="Reduce motion" description="Turns off animations. VAAKYA also follows your device setting." checked={prefs.reducedMotion} onChange={(v) => set({ reducedMotion: v }, `Reduce motion ${v ? "on" : "off"}`)} />
          <Switch label="Voice-first mode" description="Answers are read aloud automatically where possible." checked={prefs.voiceFirst} onChange={(v) => set({ voiceFirst: v }, `Voice-first ${v ? "on" : "off"}`)} />
          <Switch label="Simple words mode" description="Shorter sentences, larger icons and fewer numbers per screen." checked={prefs.lowLiteracy} onChange={(v) => set({ lowLiteracy: v }, `Simple words ${v ? "on" : "off"}`)} />
        </div>
        <Button variant="secondary" className="mt-5" onClick={() => { reset(); announce("Settings reset to default"); }}>Reset to default</Button>
      </Card>
      <Card className="lg:col-span-2" aria-labelledby="kb-h">
        <CardHeader id="kb-h" eyebrow="Keyboard" title="Keyboard and screen reader tips" />
        <ul className="grid gap-2 text-ink-2 sm:grid-cols-2">
          <li><kbd className="rounded bg-surface-2 px-1.5">Tab</kbd> moves between controls; the first stop is “Skip to main content”.</li>
          <li>Each page has one main heading; screen readers can list headings and landmarks.</li>
          <li>Every chart has a written summary and a “Show data as a table” option.</li>
          <li>In Ask VAAKYA, <kbd className="rounded bg-surface-2 px-1.5">Enter</kbd> sends and <kbd className="rounded bg-surface-2 px-1.5">Shift + Enter</kbd> adds a line.</li>
        </ul>
      </Card>
    </div>
  );
}
