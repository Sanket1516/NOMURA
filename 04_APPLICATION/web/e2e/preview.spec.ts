import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  ["home", "/home", /Good (morning|afternoon|evening), Priya/],
  ["assistant", "/assistant", /Ask VAAKYA/],
  ["planning", "/planning", /Financial planning/],
  ["goals", "/goals", /Your goals/],
  ["shield", "/shield", /Scam Shield/],
  ["schemes", "/schemes", /Government schemes/],
  ["learn", "/learn", /Learning Academy/],
  ["score", "/score", /Financial Confidence Score/],
  ["voice", "/voice", /Voice Companion/],
  ["accessibility", "/settings/accessibility", /Accessibility/],
  ["profile", "/profile", /Profile/],
  ["notifications", "/notifications", /Notifications/],
] as const;

async function previewAs(page: Page, persona = "priya") {
  await page.goto("/login");
  await page.locator(`input[name=persona][value=${persona}]`).check({ force: true });
  await page.getByRole("button", { name: /Preview as selected person/ }).click();
  await page.waitForURL("**/home");
}

async function axe(page: Page) {
  // Entry animations fade content in; scan the settled page (users with reduced motion see it immediately).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(50);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
}

test("public pages render and pass axe", async ({ page }) => {
  for (const [path, h] of [["/", /Money decisions/], ["/login", /Welcome back/], ["/register", /Create your VAAKYA account/], ["/about-ai", /How VAAKYA uses AI/]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(h);
    expect(await axe(page), `axe on ${path}`).toEqual([]);
  }
});

test("app routes redirect to login without a session", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login\?next=%2Fhome/);
});

test("preview: every app page renders with the sample-data label and passes axe", async ({ page }) => {
  await previewAs(page);
  for (const [, path, h] of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(h);
    await expect(page.getByText(/Preview with sample data/).first()).toBeVisible();
    expect(await axe(page), `axe on ${path}`).toEqual([]);
  }
});

test("onboarding: consent, persona and profile steps work and say nothing is saved", async ({ page }) => {
  await previewAs(page, "rajesh");
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "One permission is needed" })).toBeVisible();
  await page.getByLabel(/Use my answers to give me guidance/).check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await page.waitForURL("**/onboarding/persona");
  await page.locator("input[name=persona][value=rajesh]").check({ force: true });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/onboarding/profile?persona=rajesh");
  await expect(page.getByLabel("How does your income arrive?")).toHaveValue("variable");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter the name VAAKYA should use")).toBeVisible();
  await page.getByLabel("What should we call you?").fill("Rajesh");
  await page.getByLabel("Year of birth").fill("2002");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Your money" })).toBeFocused();
  await expect(page.getByText("Preview mode: answers are not saved")).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("assistant never fabricates an answer in preview", async ({ page }) => {
  await previewAs(page);
  await page.goto("/assistant");
  await page.getByRole("radio", { name: "Sentinel" }).check({ force: true });
  await page.getByLabel("Your question").fill("Is this loan app safe?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Not answered.")).toBeVisible();
  await expect(page.getByText("AI agents are not connected in preview")).toBeVisible();
});

test("scam shield validates and reports preview honestly", async ({ page }) => {
  await previewAs(page);
  await page.goto("/shield");
  await page.getByLabel("Message, offer or link").fill("Your KYC expires today. Share OTP to continue");
  await page.getByRole("button", { name: "Check message" }).click();
  await expect(page.getByText("Sentinel is not connected in preview")).toBeVisible();
  await page.getByRole("tab", { name: "Upload screenshot" }).click();
  await expect(page.getByRole("button", { name: "Check screenshot" })).toBeDisabled();
});

test("accessibility settings change text size, contrast and motion, and persist", async ({ page }) => {
  await previewAs(page);
  await page.goto("/settings/accessibility");
  await page.getByText("Largest", { exact: true }).click();
  await page.getByRole("switch", { name: "High contrast" }).click();
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-contrast", "high");
  await expect(html).toHaveAttribute("data-motion", "reduce");
  expect(await html.evaluate((el) => getComputedStyle(el).getPropertyValue("--text-scale").trim())).toBe("1.5");
  await page.goto("/home");
  await expect(html).toHaveAttribute("data-contrast", "high");
  expect(await axe(page), "axe in high contrast + 150% text").toEqual([]);
});

test("keyboard: skip link is first and moves focus to main", async ({ page }) => {
  await previewAs(page);
  await page.goto("/home");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("charts have text equivalents and tables", async ({ page }) => {
  await previewAs(page);
  await page.goto("/score");
  await expect(page.locator("figcaption").first()).toContainText("Score 63 out of 100, Fair");
  await page.getByText("Show data as a table").first().click();
  await expect(page.getByRole("table", { name: "Confidence score by dimension" })).toBeVisible();
});

test("PWA manifest and service worker are served", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.display).toBe("standalone");
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect((await request.get("/sw.js")).status()).toBe(200);
  expect((await request.get("/icons/icon-512.png")).status()).toBe(200);
});

test("API proxy refuses without session and in preview", async ({ page, request }) => {
  expect((await request.get("/api/proxy/v1/dashboard")).status()).toBe(401);
  await previewAs(page);
  const r = await page.request.post("/api/proxy/v1/chat", { data: { message: "hi" } });
  expect(r.status()).toBe(503);
  expect((await r.json()).title).toBe("Preview mode");
});

test("no page scrolls horizontally on a 360 px phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  await ctx.addCookies([{ name: "vaakya_preview", value: "kisan", url: "http://localhost:3100" }]);
  const page = await ctx.newPage();
  for (const path of ["/", "/login", "/register", "/onboarding", "/onboarding/persona", "/onboarding/profile", ...PAGES.map((p) => p[1])]) {
    await page.goto(path);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
  }
  await ctx.close();
});
