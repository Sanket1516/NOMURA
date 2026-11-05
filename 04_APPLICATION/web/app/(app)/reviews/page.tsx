import { redirect } from "next/navigation";
import { loadDashboard } from "@/lib/server/data";
import { apiFetch } from "@/lib/server/api";

export default async function ReviewsIndex() {
  const d = await loadDashboard();
  const months = d.origin === "live" ? await apiFetch<string[]>("/v1/reviews") : [d.score.history.at(-1)?.month ?? "2026-11"];
  redirect(`/reviews/${months[0] ?? new Date().toISOString().slice(0, 7)}`);
}
