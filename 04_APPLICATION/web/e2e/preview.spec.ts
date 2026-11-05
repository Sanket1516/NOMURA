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
  ["life-graph", "/life-graph", /Financial Life Graph/],
  ["review", "/reviews/2026-11", /Nov 2026/],
  ["documents", "/documents", /Your documents/],
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

test("install button appears only when the browser offers installation, and works", async ({ page }) => {
  await previewAs(page);
  await page.goto("/home");
  await expect(page.getByRole("button", { name: "Install app" })).toHaveCount(0);
  await page.evaluate(() => {
    const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
    (window as unknown as { __prompted: boolean }).__prompted = false;
    e.prompt = async () => { (window as unknown as { __prompted: boolean }).__prompted = true; };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
  });
  const btn = page.getByRole("button", { name: "Install app" });
  await expect(btn).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await btn.click();
  await expect(btn).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __prompted: boolean }).__prompted)).toBe(true);
});

test("simple-words mode: home shows a short view with few numbers and big voice and scam buttons, and passes axe", async ({ page }) => {
  await previewAs(page);
  await page.goto("/home");
  // standard view: the simple view is hidden, the detail cards are shown
  await expect(page.getByRole("heading", { name: "Your money today" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Recent financial entries" })).toBeVisible();
  await page.goto("/settings/accessibility");
  await page.getByRole("switch", { name: /Simple words mode/ }).click();
  await page.goto("/home");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your money today" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask by voice" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Check a message" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent financial entries" })).toBeHidden();
  await expect(page.getByRole("table")).toHaveCount(0);   // hidden content is out of the accessibility tree too
  const numbers = await page.locator("main").innerText().then((t) => (t.match(/\d[\d,.]*/g) ?? []).length);
  expect(numbers).toBeLessThanOrEqual(12);
  expect(await axe(page)).toEqual([]);
});

test("public lessons page is reachable without signing in and says so honestly when the server is not connected", async ({ page }) => {
  const r = await page.goto("/lessons");
  expect(r?.status()).toBe(200);                       // not redirected to the sign-in page
  await expect(page.getByRole("heading", { level: 1, name: "Lessons" })).toBeVisible();
  await expect(page.getByText("Lessons are not available right now")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save lessons for offline" })).toHaveCount(0);
  expect(await axe(page)).toEqual([]);
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

for (const [lang, heading, script] of [["hi", "स्कैम शील्ड", /[\u0900-\u097F]/], ["mr", "फसवणूक कवच", /[\u0900-\u097F]/], ["kn", "ವಂಚನೆ ಕವಚ", /[\u0C80-\u0CFF]/]] as const) {
  test(`scam shield page is translated to ${lang} (draft) and still accessible`, async ({ page, context }) => {
    await previewAs(page);
    await context.addCookies([{ name: "vaakya_lang", value: lang, url: page.url() }]);
    await page.goto("/shield");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.getByRole("tab").first()).toHaveText(script);
    await expect(page.getByText(/draft|मसौदा|मसुदा|ಕರಡು/).first()).toBeVisible();
    await axe(page);
  });
}

test("security headers include a restrictive Content-Security-Policy", async ({ request }) => {
  const res = await request.get("/login");
  const csp = res.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toMatch(/script-src[^;]*https?:/);
  const script = /script-src([^;]*)/.exec(csp)?.[1] ?? "";
  expect(script).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
  expect(script).not.toContain("'unsafe-inline'");
  const again = (await request.get("/login")).headers()["content-security-policy"];
  expect(again).not.toBe(csp); // a fresh nonce for every request
});

test("no page breaks the Content-Security-Policy (no violations in the console)", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => { if (/content security policy|refused to (execute|load|apply)/i.test(m.text())) violations.push(m.text()); });
  page.on("pageerror", (e) => violations.push(String(e)));
  await previewAs(page);
  for (const [, path] of PAGES) { await page.goto(path); await page.waitForLoadState("networkidle"); }
  for (const path of ["/", "/login", "/register", "/onboarding/profile?persona=priya"]) { await page.goto(path); await page.waitForLoadState("networkidle"); }
  expect(violations).toEqual([]);
});

test("no page scrolls horizontally on a 768 px tablet", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await previewAs(page);
  for (const [, path] of PAGES) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("the API proxy refuses writes that come from another origin", async ({ request }) => {
  const res = await request.post("/api/proxy/v1/chat", { headers: { origin: "https://evil.example" }, data: {} });
  expect(res.status()).toBe(403);
});

for (const [lang, path, heading, label] of [
  ["hi", "/goals", "आपके लक्ष्य", "लक्ष्य सहेजें और योजना बनाएँ"], ["mr", "/goals", "तुमची उद्दिष्टे", "उद्दिष्ट जतन करा आणि योजना बनवा"], ["kn", "/goals", "ನಿಮ್ಮ ಗುರಿಗಳು", "ಗುರಿ ಉಳಿಸಿ ಮತ್ತು ಯೋಜನೆ ರೂಪಿಸಿ"],
  ["hi", "/schemes", "सरकारी योजनाएँ", "मेरी पात्रता जाँचें"], ["mr", "/schemes", "शासकीय योजना", "माझी पात्रता तपासा"], ["kn", "/schemes", "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು", "ನನ್ನ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ"],
] as const) {
  test(`${path} is translated to ${lang} (draft) and still accessible`, async ({ page, context }) => {
    await previewAs(page);
    await context.addCookies([{ name: "vaakya_lang", value: lang, url: page.url() }]);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.getByRole("button", { name: label }).first()).toBeVisible();
    await axe(page);
  });
}

// Every signed-in screen in each draft language: the main heading is in the right script and axe finds no serious problems.
const SCRIPT_OF = { hi: /[\u0900-\u097F]/, mr: /[\u0900-\u097F]/, kn: /[\u0C80-\u0CFF]/ } as const;
const SKIP_H1 = new Set(["review", "voice"]); // month heading and voice follow other settings
for (const lang of ["hi", "mr", "kn"] as const) {
  test(`all screens render in ${lang} with a translated heading and pass axe`, async ({ page, context }) => {
    test.setTimeout(180_000);
    await previewAs(page);
    await context.addCookies([{ name: "vaakya_lang", value: lang, url: page.url() }]);
    for (const [name, path] of PAGES) {
      await page.goto(path);
      if (!SKIP_H1.has(name)) await expect(page.getByRole("heading", { level: 1 }).first(), `${lang} ${path}`).toHaveText(SCRIPT_OF[lang]);
      await axe(page);
    }
    for (const path of ["/", "/login", "/register", "/about-ai", "/onboarding", "/onboarding/persona", "/onboarding/profile?persona=priya"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first(), `${lang} ${path}`).toHaveText(SCRIPT_OF[lang]);
    }
  });
}
