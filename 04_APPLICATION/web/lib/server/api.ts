import "server-only";
import { config } from "./config";
import { accessToken, getViewer } from "./session";
import type { Problem } from "../types";

export class ApiError extends Error {
  constructor(public problem: Problem) {
    super(problem.detail ?? problem.title);
  }
}

/** Server-side call to the FastAPI service with the viewer's bearer token. Live mode only. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const viewer = await getViewer();
  if (!viewer || viewer.mode !== "live") {
    throw new ApiError({ type: "about:blank", title: "Not signed in", status: 401 });
  }
  const token = await accessToken(viewer.sid);
  if (!token) throw new ApiError({ type: "about:blank", title: "Session expired", status: 401 });
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError({ type: "about:blank", title: "VAAKYA service unreachable", status: 503 });
  }
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as Problem | null;
    throw new ApiError(problem ?? { type: "about:blank", title: res.statusText, status: res.status });
  }
  return (await res.json()) as T;
}
