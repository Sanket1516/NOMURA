import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/server/config";
import { cookieOptions, PREVIEW_COOKIE } from "@/lib/server/session";
import { isPersona } from "@/lib/demo";

/** Sample-data preview: no account, nothing saved. Clearly labelled on every screen. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const persona = String(form.get("persona") ?? "");
  if (!config.previewEnabled || !isPersona(persona)) {
    return NextResponse.redirect(new URL("/login?error=preview_unavailable", config.appUrl), 303);
  }
  const res = NextResponse.redirect(new URL(String(form.get("next") ?? "/home"), config.appUrl), 303);
  res.cookies.set(PREVIEW_COOKIE, persona, { ...cookieOptions, maxAge: 60 * 60 * 24 });
  return res;
}
