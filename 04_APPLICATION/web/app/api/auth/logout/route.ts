import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/server/config";
import { endSession, PREVIEW_COOKIE, SID_COOKIE } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get(SID_COOKIE)?.value;
  const tokens = sid ? endSession(sid) : undefined;
  let target = new URL("/", config.appUrl);
  if (tokens?.id_token && config.oidc.publicIssuer) {
    target = new URL(`${config.oidc.publicIssuer}/protocol/openid-connect/logout`);
    target.search = new URLSearchParams({ id_token_hint: tokens.id_token, post_logout_redirect_uri: config.appUrl }).toString();
  }
  const res = NextResponse.redirect(target, 303);
  res.cookies.delete(SID_COOKIE);
  res.cookies.delete(PREVIEW_COOKIE);
  return res;
}
