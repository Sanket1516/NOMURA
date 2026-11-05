import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { config } from "./config";
import { isPersona } from "../demo";
import type { PersonaId } from "../types";

export const SID_COOKIE = "vaakya_sid";
export const PREVIEW_COOKIE = "vaakya_preview";

interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_at: number; // epoch seconds
}

/**
 * Server-side token store. Tokens never reach browser JavaScript (FRONTEND_ARCHITECTURE §7).
 * In-memory: correct for one web replica. Multiple replicas need a shared store (documented limit).
 */
const store: Map<string, TokenSet> = ((globalThis as { __vaakyaSessions?: Map<string, TokenSet> }).__vaakyaSessions ??= new Map());

export type Viewer =
  | { mode: "live"; sid: string }
  | { mode: "preview"; persona: PersonaId }
  | null;

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  const sid = jar.get(SID_COOKIE)?.value;
  if (sid && store.has(sid)) return { mode: "live", sid };
  const persona = jar.get(PREVIEW_COOKIE)?.value;
  if (config.previewEnabled && isPersona(persona)) return { mode: "preview", persona };
  return null;
}

export function createSession(tokens: Omit<TokenSet, "expires_at"> & { expires_in: number }): string {
  const sid = randomBytes(32).toString("base64url");
  store.set(sid, { ...tokens, expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in });
  return sid;
}

export function endSession(sid: string): TokenSet | undefined {
  const t = store.get(sid);
  store.delete(sid);
  return t;
}

async function refresh(sid: string, t: TokenSet): Promise<TokenSet | null> {
  if (!t.refresh_token) return null;
  const res = await fetch(`${config.oidc.issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token", refresh_token: t.refresh_token,
      client_id: config.oidc.clientId, client_secret: config.oidc.clientSecret,
    }),
    cache: "no-store",
  });
  if (!res.ok) { store.delete(sid); return null; }
  const j = await res.json();
  const next: TokenSet = { access_token: j.access_token, refresh_token: j.refresh_token ?? t.refresh_token, id_token: j.id_token ?? t.id_token,
    expires_at: Math.floor(Date.now() / 1000) + j.expires_in };
  store.set(sid, next);
  return next;
}

/** A valid access token for the session, refreshed 30 s before expiry. */
export async function accessToken(sid: string): Promise<string | null> {
  const t = store.get(sid);
  if (!t) return null;
  if (t.expires_at - 30 > Date.now() / 1000) return t.access_token;
  return (await refresh(sid, t))?.access_token ?? null;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.appUrl.startsWith("https://"),
  path: "/",
};
