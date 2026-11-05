import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Live journeys against the full Compose stack (web :3000, Keycloak :8080, API, Neo4j, Qdrant, SeaweedFS, inference).
// Run: LIVE_E2E=1 E2E_BASE_URL=http://localhost:3000 DEMO_PASSWORD=... npx playwright test e2e/live.spec.ts
test.skip(!process.env.LIVE_E2E, "live stack only");
test.describe.configure({ mode: "serial" });

const OUT = path.resolve(__dirname, "../../../07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live");
const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("a[href=\"/api/auth/login\"]").click();
  await page.waitForURL(/localhost:8080\/realms\/vaakya/);
  await page.locator("#username").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
  await page.waitForURL(/localhost:3000\/(home|onboarding)/);
}

test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } });

test("1 demo user signs in through Keycloak and sees live data", async ({ page }) => {
  await signIn(page, "demo-priya@vaakya.invalid", process.env.DEMO_PASSWORD!);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Priya");
  await expect(page.getByText("Your data").first()).toBeVisible();
  await expect(page.getByText("Preview with sample data")).toHaveCount(0);
  await shot(page, "01-dashboard-live");
});

test("2 educator answers from sources with citations", async ({ page }) => {
  await signIn(page, "demo-priya@vaakya.invalid", process.env.DEMO_PASSWORD!);
  await page.goto("/assistant");
  await page.getByLabel("Your question").fill("What is a SIP and is the return fixed?");
  await page.getByRole("button", { name: "Send" }).click();
  const answer = page.getByRole("log").locator("article").last();
  await expect(answer.getByText("Educator")).toBeVisible({ timeout: 30_000 });
  await expect(answer.getByText("Sources")).toBeVisible();
  await expect(answer).toContainText("Systematic Investment Plan");
  await page.getByLabel("Your question").fill("Got this: Instant loan in 5 minutes without documents, allow contacts permission. Safe?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("log").locator("article").last().getByText("Sentinel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("log").locator("article").last().getByText("Strategy Builder")).toBeVisible();
  await shot(page, "02-assistant-live");
});

test("3 scam check: pasted text and a screenshot through real OCR", async ({ page }) => {
  await signIn(page, "demo-priya@vaakya.invalid", process.env.DEMO_PASSWORD!);
  await page.goto("/shield");
  await page.getByLabel("Message, offer or link").fill("Congratulations! You have won Rs 25,00,000 in KBC lucky draw. Pay processing fee of Rs 4,999 to claim");
  await page.getByRole("button", { name: "Check message" }).click();
  await expect(page.getByText(/High risk|Critical risk/).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("tab", { name: "Upload screenshot" }).click();
  await page.locator("input[type=file]").setInputFiles(path.resolve(__dirname, "fixtures-scam-sms.png"));
  await page.getByRole("button", { name: "Check screenshot" }).click();
  await expect(page.locator("#verdict-h")).toContainText(/Critical risk|High risk/, { timeout: 60_000 });
  await expect(page.getByText(/OTP|KYC/).first()).toBeVisible();
  await shot(page, "03-scam-shield-live-ocr");
});

test("4 schemes: real eligibility with unknowns asked, not guessed", async ({ page }) => {
  await signIn(page, "demo-priya@vaakya.invalid", process.env.DEMO_PASSWORD!);
  await page.goto("/schemes");
  const card = page.locator("li", { hasText: "PM Jeevan Jyoti Bima Yojana" });
  await card.getByRole("button", { name: "Check my eligibility" }).click();
  await expect(card.getByText("Aged 18 to 50 when joining")).toBeVisible({ timeout: 30_000 });
  await expect(card.getByText("How to apply")).toBeVisible();
  await shot(page, "04-schemes-live");
});

test("5 planning, life graph, lesson quiz", async ({ page }) => {
  await signIn(page, "demo-priya@vaakya.invalid", process.env.DEMO_PASSWORD!);
  await page.goto("/planning");
  await expect(page.getByText(/Formula:/)).toBeVisible();
  await shot(page, "05-planning-live");
  await page.goto("/life-graph");
  await expect(page.getByText("Live from your graph")).toBeVisible();
  await shot(page, "06-life-graph-live");
  await page.goto("/learn/credit-score");
  const qs = page.locator("fieldset");
  for (let i = 0; i < (await qs.count()); i++) await qs.nth(i).locator("input[type=radio]").first().check();
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText(/of 3 correct/).first()).toBeVisible({ timeout: 20_000 });
  await shot(page, "07-lesson-quiz-live");
  await page.goto("/score");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Financial Confidence Score");
  await shot(page, "08-score-live");
});

test("6 voice reports the missing speech model honestly", async ({ browser }) => {
  const ctx = await browser.newContext({ permissions: ["microphone"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await signIn(page, "demo-priya@vaakya.invalid", process.env.DEMO_PASSWORD!);
  await page.goto("/voice");
  await page.getByRole("button", { name: "Start speaking" }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Stop and send" }).click();
  await expect(page.getByText(/not installed|T0.08/)).toBeVisible({ timeout: 30_000 });
  await shot(page, "09-voice-live-mobile");
  await ctx.close();
});

test("7 a new user registers in Keycloak and onboards", async ({ page }) => {
  const email = `e2e-${Date.now()}@vaakya.invalid`;
  await page.goto("/register");
  await page.locator("a[href=\"/api/auth/login?register=1\"]").click();
  await page.waitForURL(/localhost:8080/);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Test-pass-2026!");
  await page.locator("#password-confirm").fill("Test-pass-2026!");
  if (await page.locator("#firstName").count()) await page.locator("#firstName").fill("Asha");
  if (await page.locator("#lastName").count()) await page.locator("#lastName").fill("Test");
  await page.locator("input[type=submit], button[type=submit]").first().click();
  await page.waitForURL(/localhost:3000\/onboarding/, { timeout: 30_000 });
  await page.getByLabel(/Use my answers to give me guidance/).check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await page.waitForURL("**/onboarding/persona");
  await page.locator("input[name=persona][value=rajesh]").check({ force: true });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("What should we call you?").fill("Asha");
  await page.getByLabel("Year of birth").fill("1999");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Income in a lean month (₹)").fill("15000");
  await page.getByLabel("Income in a good month (₹)").fill("40000");
  await page.getByLabel("Monthly spending (₹)").fill("19000");
  await page.getByRole("button", { name: "See my score" }).click();
  await page.waitForURL("**/home", { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Asha");
  await expect(page.getByText("Your data").first()).toBeVisible();
  await shot(page, "10-new-user-dashboard");
});
