import { NextResponse, type NextRequest } from "next/server";

// Route guard (Next.js 16 proxy, formerly middleware) and per-request Content-Security-Policy.
// The guard only checks cookie presence; pages and the API proxy validate the session themselves.
const PUBLIC = ["/", "/login", "/register", "/offline", "/about-ai"];

/** Scripts run only with this request's nonce (Next.js adds it to its own scripts from the CSP request header).
 *  Styles keep 'unsafe-inline' because React and the charts set style attributes, which a nonce cannot cover. */
function csp(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:", "media-src 'self' blob:", "font-src 'self' data:", "connect-src 'self'", "worker-src 'self'",
    "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'",
  ].join("; ");
}

function withCsp(req: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const policy = csp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("content-security-policy", policy);
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return withCsp(req);
  const hasSession = req.cookies.has("vaakya_sid") || req.cookies.has("vaakya_preview");
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return withCsp(req);
}

export const config = {
  matcher: ["/((?!api|_next|icons|fonts|manifest.webmanifest|sw.js|favicon.ico|robots.txt).*)"],
};
