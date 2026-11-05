import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoDashboard } from "../demo";
import { isLang } from "../i18n/nav";
import type { Dashboard, Lang } from "../types";
import { apiFetch } from "./api";
import { getViewer } from "./session";

/** The dashboard view model: sample data in preview mode, the API in live mode. Never silently mixed. */
export const loadDashboard = cache(async function loadDashboard(): Promise<Dashboard> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.mode === "preview") return demoDashboard(viewer.persona);
  const d = await apiFetch<Omit<Dashboard, "origin">>("/v1/dashboard");
  return { ...d, origin: "live" };
});

export async function uiLang(): Promise<Lang> {
  const v = (await cookies()).get("vaakya_lang")?.value;
  return isLang(v) ? v : "en";
}
