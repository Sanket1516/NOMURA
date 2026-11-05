// Load and latency measurement for the signed-in read paths (KI-09). No new dependencies: Node 22 fetch + Playwright (for the one sign-in).
//
//   NODE_TLS_REJECT_UNAUTHORIZED=0 BASE=https://localhost DEMO_PASSWORD=... node scripts/load_test.mjs
//
// Env: BASE (default https://localhost) · DEMO_PASSWORD · DEMO_USER (default demo-priya@vaakya.invalid) · LEVELS (default 1,5,10,25 concurrent users)
//      SECONDS (per level, default 15) · CHAT (number of single chat questions to time, default 0; the API allows 30 per hour per user)
//      COOKIE (a ready "name=value; ..." header: skips the browser sign-in, used to test this script against a mock) · OUT (markdown file to write)
// Only GET endpoints are loaded, so nothing is written to the demo account. All figures come from this run; nothing is estimated.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = (process.env.BASE ?? "https://localhost").replace(/\/$/, "");
const LEVELS = (process.env.LEVELS ?? "1,5,10,25").split(",").map(Number);
const SECONDS = Number(process.env.SECONDS ?? 15);
const CHAT = Number(process.env.CHAT ?? 0);
const PATHS = ["/api/proxy/v1/dashboard", "/api/proxy/v1/goals", "/api/proxy/v1/score", "/api/proxy/v1/budget",
  "/api/proxy/v1/learning/modules", "/api/proxy/v1/notifications", "/api/proxy/v1/twin"];

export function percentile(sorted, p) {
  if (!sorted.length) return NaN;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[i];
}

export function summarise(samples, seconds) {
  const lat = samples.filter((s) => s.status >= 200 && s.status < 300).map((s) => s.ms).sort((a, b) => a - b);
  const codes = {};
  for (const s of samples) codes[s.status] = (codes[s.status] ?? 0) + 1;
  return { requests: samples.length, rps: +(samples.length / seconds).toFixed(1), ok: lat.length, codes,
    p50: percentile(lat, 50), p95: percentile(lat, 95), p99: percentile(lat, 99), max: lat.at(-1) ?? NaN };
}

async function signIn() {
  if (process.env.COOKIE) return process.env.COOKIE;
  if (!process.env.DEMO_PASSWORD) throw new Error("Set DEMO_PASSWORD (infra/secrets/keycloak.env) or COOKIE");
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.locator('a[href="/api/auth/login"]').click();
  await page.waitForURL(/\/realms\/vaakya\//);
  await page.locator("#username").fill(process.env.DEMO_USER ?? "demo-priya@vaakya.invalid");
  await page.locator("#password").fill(process.env.DEMO_PASSWORD);
  await page.locator("#kc-login").click();
  await page.waitForURL(/\/(home|onboarding)/);
  const cookies = await ctx.cookies();
  await browser.close();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function timed(url, cookie, init = {}) {
  const t = performance.now();
  try {
    const r = await fetch(url, { ...init, headers: { cookie, accept: "application/json", ...(init.headers ?? {}) } });
    await r.arrayBuffer();
    return { status: r.status, ms: performance.now() - t };
  } catch { return { status: 0, ms: performance.now() - t }; }   // 0 = connection failed
}

async function level(users, cookie) {
  const samples = [];
  const end = performance.now() + SECONDS * 1000;
  await Promise.all(Array.from({ length: users }, async (_, w) => {
    for (let i = w; performance.now() < end; i++) samples.push(await timed(BASE + PATHS[i % PATHS.length], cookie));
  }));
  return summarise(samples, SECONDS);
}

function dockerMemory() {
  try {
    return execSync("docker stats --no-stream --format \"{{.Name}}|{{.MemUsage}}|{{.CPUPerc}}\"", { encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "ignore"] })
      .trim().split("\n").map((l) => l.split("|"));
  } catch { return null; }
}

async function chatSamples(cookie) {
  const out = [];
  for (let i = 0; i < CHAT; i++) {
    const t = performance.now();
    const r = await fetch(`${BASE}/api/proxy/v1/chat`, { method: "POST", headers: { cookie, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ message: "What is a SIP and is the return fixed?", lang: "en" }) }).catch(() => null);
    const j = r ? await r.json().catch(() => null) : null;
    out.push({ status: r?.status ?? 0, ms: performance.now() - t, llm_used: j?.llm_used ?? null });
  }
  return out;
}

async function main() {
  const cookie = await signIn();
  const warm = await timed(BASE + PATHS[0], cookie);
  if (warm.status !== 200) throw new Error(`Warm-up request returned ${warm.status}; is the stack up and the demo user seeded?`);
  const memBefore = dockerMemory();
  const rows = [];
  for (const u of LEVELS) { const s = await level(u, cookie); rows.push({ users: u, ...s }); console.log(u, JSON.stringify(s)); }
  const memAfter = dockerMemory();
  const chat = await chatSamples(cookie);

  const md = [`# Load test run – ${new Date().toISOString()}`, "",
    `Target ${BASE}; ${SECONDS} s per level; GET only; paths: ${PATHS.map((p) => p.replace("/api/proxy", "")).join(", ")}. One machine runs both the stack and this script, so numbers are a lower bound on a real deployment.`, "",
    "| Concurrent users | Requests | Req/s | p50 ms | p95 ms | p99 ms | max ms | Status codes |", "|---|---|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.users} | ${r.requests} | ${r.rps} | ${r.p50.toFixed(0)} | ${r.p95.toFixed(0)} | ${r.p99.toFixed(0)} | ${r.max.toFixed(0)} | ${JSON.stringify(r.codes)} |`), ""];
  if (chat.length) {
    const l = chat.filter((c) => c.status === 200).map((c) => c.ms).sort((a, b) => a - b);
    md.push(`Chat (${chat.length} sequential questions): statuses ${JSON.stringify(chat.map((c) => c.status))}, llm_used ${JSON.stringify(chat.map((c) => c.llm_used))}, median ${percentile(l, 50).toFixed(0)} ms, max ${(l.at(-1) ?? NaN).toFixed(0)} ms`, "");
  }
  if (memAfter) md.push("Container memory and CPU after the run (`docker stats --no-stream`):", "", "| Container | Memory | CPU |", "|---|---|---|", ...memAfter.map((m) => `| ${m.join(" | ")} |`), "");
  else md.push("Container memory: `docker stats` was not available to this script.", "");
  if (memBefore) md.push(`(${memBefore.length} containers sampled before the run as well.)`, "");
  const text = md.join("\n");
  console.log("\n" + text);
  writeFileSync(process.env.OUT ?? "load_test_result.md", text, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
