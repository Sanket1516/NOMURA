import { chromium, expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";

// Two accounts registered fresh through real Keycloak (no seeded demo data) each create their own data; each then tries to read the
// other's by ID. Nothing may leak. Test accounts use the reserved .invalid domain. Run:
// LIVE_E2E=1 E2E_BASE_URL=https://localhost npx playwright test e2e/users.spec.ts
test.skip(!process.env.LIVE_E2E, "live stack only");
test.describe.configure({ mode: "serial" });
test.setTimeout(240_000);

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const H = { origin: BASE };
const PASSWORD = "Test-pass-2026!";

interface User { name: string; ctx: BrowserContext; page: Page }
let browser: Browser;
let a: User;
let b: User;
const ids: { goalA?: string; docA?: string; convA?: string; audioA?: string } = {};

async function register(name: string, income: [string, string, string]): Promise<User> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, permissions: ["microphone"], baseURL: BASE, viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: "vaakya_lang", value: "en", url: BASE }]);
  const page = await ctx.newPage();
  await page.goto("/register");
  await page.locator("a[href=\"/api/auth/login?register=1\"]").click();
  await page.waitForURL(/\/realms\/vaakya\//);
  await page.locator("#email").fill(`e2e-${name.toLowerCase()}-${Date.now()}@vaakya.invalid`);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#password-confirm").fill(PASSWORD);
  if (await page.locator("#firstName").count()) await page.locator("#firstName").fill(name);
  if (await page.locator("#lastName").count()) await page.locator("#lastName").fill("Test");
  await page.locator("input[type=submit], button[type=submit]").first().click();
  await page.waitForURL(/\/onboarding/, { timeout: 30_000 });
  await page.getByLabel(/Use my answers to give me guidance/).check();
  const voice = page.getByLabel(/voice/i);
  if (await voice.count()) await voice.first().check().catch(() => undefined);
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await page.waitForURL("**/onboarding/persona");
  await page.locator("input[name=persona][value=rajesh]").check({ force: true });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("What should we call you?").fill(name);
  await page.getByLabel("Year of birth").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Income in a lean month (₹)").fill(income[0]);
  await page.getByLabel("Income in a good month (₹)").fill(income[1]);
  await page.getByLabel("Monthly spending (₹)").fill(income[2]);
  await page.getByRole("button", { name: "See my score" }).click();
  await page.waitForURL("**/home", { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
  return { name, ctx, page };
}

const get = (u: User, p: string) => u.page.request.get(`/api/proxy${p}`);

test.beforeAll(async () => {
  browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${path.resolve(__dirname, "../../../05_TESTING/fixtures/voice/en.wav")}`] });
});
test.afterAll(async () => { await browser?.close(); });

test("1 two brand-new users register and onboard with different finances", async () => {
  a = await register("Anita", ["12000", "30000", "15000"]);
  b = await register("Bhaskar", ["50000", "90000", "40000"]);
  const [sa, sb] = [await (await get(a, "/v1/score")).json(), await (await get(b, "/v1/score")).json()];
  console.log(`score A=${sa.overall ?? sa.score} B=${sb.overall ?? sb.score}`);
  const [ba, bb] = [await (await get(a, "/v1/budget")).json(), await (await get(b, "/v1/budget")).json()];
  expect(JSON.stringify(ba)).not.toEqual(JSON.stringify(bb));
});

test("2 user A creates a goal, asks a question, speaks a question and uploads a document", async () => {
  const g = await a.page.request.post("/api/proxy/v1/goals", { headers: H, data: { type: "emergency_fund", title: "Anita secret goal", target: { paise: 9000000 }, target_date: "2028-01-01", priority: 1 } });
  expect(g.status(), await g.text()).toBe(201);
  ids.goalA = (await g.json()).id;

  const c = await a.page.request.post("/api/proxy/v1/chat", { headers: H, data: { message: "What is a SIP and is the return fixed?", lang: "en" }, timeout: 180_000 });
  expect(c.status(), await c.text()).toBe(200);
  const convs = await (await get(a, "/v1/conversations")).json();
  ids.convA = convs[0]?.id;
  expect(ids.convA).toBeTruthy();

  // consent for voice, then a real browser recording through the fixture microphone
  await a.page.request.put("/api/proxy/v1/me/consents", { headers: H, data: { grants: [{ purpose: "voice_processing", version: "2026-11", granted: true }, { purpose: "document_storage", version: "2026-11", granted: true }] } });
  await a.page.goto("/voice");
  await a.page.getByRole("button", { name: "Start speaking" }).click();
  await a.page.waitForTimeout(3500);
  const resp = a.page.waitForResponse((r) => r.url().includes("/v1/voice/query"), { timeout: 120_000 });
  await a.page.getByRole("button", { name: "Stop and send" }).click();
  const r = await resp;
  expect(r.status(), await r.text()).toBe(200);
  ids.audioA = (await r.json()).audio.url;

  const up = await a.page.request.post("/api/proxy/v1/documents", { headers: H, multipart: { file: { name: "slip.png", mimeType: "image/png", buffer: (await import("node:fs")).readFileSync(path.resolve(__dirname, "fixtures-salary-slip.png")) }, kind: "salary_slip" } });
  expect(up.status(), await up.text()).toBeLessThan(300);
  ids.docA = (await up.json()).id;
});

test("3 user B cannot read, change or delete anything of user A", async () => {
  const bGoals = JSON.stringify(await (await get(b, "/v1/goals")).json());
  expect(bGoals).not.toContain("Anita");
  expect(bGoals).not.toContain(ids.goalA!);
  expect((await get(b, `/v1/goals/${ids.goalA}`)).status()).toBe(404);
  expect((await get(b, `/v1/goals/${ids.goalA}/plan`)).status()).toBe(404);
  expect((await b.page.request.delete(`/api/proxy/v1/goals/${ids.goalA}`, { headers: H })).status()).toBe(404);
  expect(JSON.stringify(await (await get(b, "/v1/conversations")).json())).not.toContain(ids.convA!);
  expect((await get(b, ids.audioA!.replace(/^/, ""))).status()).toBe(404);
  {
    expect(JSON.stringify(await (await get(b, "/v1/documents")).json())).not.toContain(ids.docA!);
    expect((await get(b, `/v1/documents/${ids.docA}`)).status()).toBe(404);
    expect((await b.page.request.delete(`/api/proxy/v1/documents/${ids.docA}`, { headers: H })).status()).toBe(404);
  }
  const twin = JSON.stringify(await (await get(b, "/v1/twin")).json());
  expect(twin).not.toContain("Anita");
  // A's data is still intact after B's delete attempts
  expect((await get(a, `/v1/goals/${ids.goalA}`)).status()).toBe(200);
});

test("4 export contains only the caller's data; erase removes it and signs the account out of its data", async () => {
  const ex = await b.page.request.post("/api/proxy/v1/me/export", { headers: H });
  expect(ex.status()).toBe(200);
  const text = await ex.text();
  expect(text).toContain("Bhaskar");
  expect(text).not.toContain("Anita");
  const del = await a.page.request.delete("/api/proxy/v1/me", { headers: H });
  expect(del.status()).toBe(202);
  await a.page.waitForTimeout(8000);
  const after = await get(a, `/v1/goals/${ids.goalA}`);
  expect([401, 403, 404]).toContain(after.status());
  // B is untouched by A's erasure
  expect((await get(b, "/v1/score")).status()).toBe(200);
});
