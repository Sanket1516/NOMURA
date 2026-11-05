import "server-only";
import { config } from "./config";

export interface LessonSummary { id: string; title: string; topic: string; minutes: number; content_status: string }
export interface LessonText extends LessonSummary { sections: { heading: string; body: string }[] }

/** Public lesson content from the API. No session and no cookies are sent: the answer is the same for everyone, so the browser may cache it.
 *  Returns null when the API is not configured or unreachable (the page then says so; nothing is invented). */
export async function publicGet<T>(path: string): Promise<T | null> {
  if (!config.apiUrl) return null;
  try {
    const r = await fetch(`${config.apiUrl}/v1/public${path}`, { headers: { accept: "application/json" }, cache: "no-store" });
    return r.ok ? ((await r.json()) as T) : null;
  } catch { return null; }
}
