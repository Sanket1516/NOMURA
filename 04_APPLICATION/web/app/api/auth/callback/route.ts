import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/server/config";
import { cookieOptions, createSession, PREVIEW_COOKIE, SID_COOKIE } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, config.appUrl));
  const raw = req.cookies.get("vaakya_oidc")?.value;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!raw || !code || !state) return fail("invalid_callback");
  let saved: { verifier: string; state: string };
  try { saved = JSON.parse(raw); } catch { return fail("invalid_callback"); }
  if (saved.state !== state) return fail("state_mismatch");

  const tokenRes = await fetch(`${config.oidc.issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code", code, code_verifier: saved.verifier,
      redirect_uri: `${config.appUrl}/api/auth/callback`,
      client_id: config.oidc.clientId, client_secret: config.oidc.clientSecret,
    }),
    cache: "no-store",
  }).catch(() => null);
  if (!tokenRes?.ok) return fail("token_exchange");
  const tokens = await tokenRes.json();
  const sid = createSession(tokens);
  const res = NextResponse.redirect(new URL("/home", config.appUrl));
  res.cookies.set(SID_COOKIE, sid, { ...cookieOptions, maxAge: 60 * 60 * 12 });
  res.cookies.delete("vaakya_oidc");
  res.cookies.delete(PREVIEW_COOKIE);
  return res;
}
