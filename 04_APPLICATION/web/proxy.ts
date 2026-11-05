import { NextResponse, type NextRequest } from "next/server";

// Route guard (Next.js 16 proxy, formerly middleware). It only checks cookie presence;
// pages and the API proxy validate the session itself.
const PUBLIC = ["/", "/login", "/register", "/offline", "/about-ai"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  const hasSession = req.cookies.has("vaakya_sid") || req.cookies.has("vaakya_preview");
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|icons|fonts|manifest.webmanifest|sw.js|favicon.ico|robots.txt).*)"],
};
