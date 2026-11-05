import { NextResponse, type NextRequest } from "next/server";
import { config, liveEnabled } from "@/lib/server/config";
import { cookieOptions } from "@/lib/server/session";
import { pkcePair, randomToken } from "@/lib/server/pkce";

/** Starts OIDC Authorization Code + PKCE. `?register=1` opens the Keycloak registration page. */
export async function GET(req: NextRequest) {
  if (!liveEnabled()) {
    return NextResponse.redirect(new URL("/login?error=not_configured", config.appUrl));
  }
  const { verifier, challenge } = pkcePair();
  const state = randomToken();
  const nonce = randomToken();
  const url = new URL(`${config.oidc.publicIssuer}/protocol/openid-connect/${req.nextUrl.searchParams.get("register") ? "registrations" : "auth"}`);
  url.search = new URLSearchParams({
    client_id: config.oidc.clientId,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: `${config.appUrl}/api/auth/callback`,
    state, nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set("vaakya_oidc", JSON.stringify({ verifier, state }), { ...cookieOptions, maxAge: 600 });
  return res;
}
