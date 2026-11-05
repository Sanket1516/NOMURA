import type { Problem } from "../types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; problem: Problem };

/** Browser → same-origin BFF proxy. Never holds tokens. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (json !== undefined) headers.set("content-type", "application/json");
  headers.set("accept", headers.get("accept") ?? "application/json");
  let res: Response;
  try {
    res = await fetch(`/api/proxy${path}`, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body });
  } catch {
    return { ok: false, problem: { type: "about:blank", title: "You appear to be offline", status: 0, detail: "Check your connection and try again." } };
  }
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as Problem | null;
    return { ok: false, problem: problem ?? { type: "about:blank", title: res.statusText || "Request failed", status: res.status } };
  }
  const ct = res.headers.get("content-type") ?? "";
  return { ok: true, data: (ct.includes("json") ? await res.json() : (await res.blob())) as T };
}

export const isPreviewProblem = (p: Problem) => p.status === 503 && p.title === "Preview mode";
