import type { Metadata } from "next";
export const metadata: Metadata = { title: "How VAAKYA uses AI" };

export default function AboutAi() {
  const rows = [
    ["What it is", "VAAKYA is an AI system with four agents. You are talking to software, not a person."],
    ["What it does well", "Explains money topics from trusted sources, builds savings plans with tested calculators, flags scam signs and checks scheme rules."],
    ["Limits", "It can be wrong. It gives educational guidance, not regulated financial advice. It does not know scheme decisions made after its data was last checked."],
    ["Your data", "Processed on VAAKYA's own server. Not sent to outside AI companies. Identifiers are removed before the reasoning model sees your question."],
    ["Numbers", "Every rupee figure comes from code you can inspect in “Why this?”. The AI only puts it into words."],
    ["Your choice", "VAAKYA explains options. You decide."],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl">How VAAKYA uses AI</h1>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map(([k, v]) => <div key={k} className="grid gap-1 p-5 sm:grid-cols-[180px_1fr]"><dt className="font-semibold">{k}</dt><dd className="text-ink-2">{v}</dd></div>)}
      </dl>
    </div>
  );
}
