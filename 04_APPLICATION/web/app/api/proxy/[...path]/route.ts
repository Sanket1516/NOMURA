import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/server/config";
import { accessToken, getViewer } from "@/lib/server/session";

/**
 * Backend-for-frontend proxy. Browser → /api/proxy/v1/... → FastAPI with the session's bearer token.
 * Streams responses (SSE for chat). In preview mode, returns 503 with a clear problem: no AI is faked.
 */
async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (path[0] !== "v1") return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return problem(401, "Not signed in");
  if (viewer.mode === "preview") {
    return problem(503, "Preview mode", "You are viewing sample data. Sign in with an account to use VAAKYA's agents and save data.");
  }
  const token = await accessToken(viewer.sid);
  if (!token) return problem(401, "Session expired");
  const target = `${config.apiUrl}/${path.join("/")}${req.nextUrl.search}`;
  const headers = new Headers({ authorization: `Bearer ${token}` });
  for (const h of ["content-type", "accept", "accept-language", "idempotency-key", "x-request-id"]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method, headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
      // @ts-expect-error duplex is required by Node fetch for streamed request bodies
      duplex: "half",
      cache: "no-store",
    });
  } catch {
    return problem(503, "VAAKYA service unreachable", "The API did not respond. Try again shortly.");
  }
  const out = new Headers();
  for (const h of ["content-type", "cache-control", "x-request-id", "retry-after", "content-disposition"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json({ type: "about:blank", title, status, detail }, { status, headers: { "content-type": "application/problem+json" } });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
