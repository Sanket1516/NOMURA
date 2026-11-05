import { test, type Browser } from "@playwright/test";
import path from "node:path";

// Captures product screenshots. Run with: SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
const OUT = path.resolve(__dirname, "../../../07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND");
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 834, height: 1112 }, mobile: { width: 390, height: 844 } } as const;
const PAGES: [string, string, boolean][] = [
  ["01-landing", "/", false], ["02-login", "/login", false], ["03-registration", "/register", false],
  ["04-onboarding-consent", "/onboarding", true], ["05-persona-selection", "/onboarding/persona", true], ["06-onboarding-profile", "/onboarding/profile?persona=kisan", true],
  ["07-dashboard", "/home", true], ["08-ai-assistant", "/assistant", true], ["09-financial-planning", "/planning", true], ["10-goals", "/goals", true],
  ["11-scam-detection", "/shield", true], ["12-schemes", "/schemes", true], ["13-learning", "/learn", true], ["14-confidence-score", "/score", true],
  ["15-voice-assistant", "/voice", true], ["16-accessibility-settings", "/settings/accessibility", true], ["17-profile", "/profile", true], ["18-notifications", "/notifications", true],
];

test.skip(!process.env.SCREENSHOTS, "screenshots only on request");

async function context(browser: Browser, vp: { width: number; height: number }, persona?: string, scheme: "light" | "dark" = "light") {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: "reduce", isMobile: vp.width < 500, hasTouch: vp.width < 900 });
  if (persona) await ctx.addCookies([{ name: "vaakya_preview", value: persona, url: "http://localhost:3100" }]);
  return ctx;
}

for (const [name, vp] of Object.entries(VIEWPORTS)) {
  test(`screenshots ${name}`, async ({ browser }) => {
    test.setTimeout(240_000);
    const ctx = await context(browser, vp, "priya");
    const page = await ctx.newPage();
    for (const [file, url] of PAGES) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${OUT}/${name}/${file}.png`, fullPage: name !== "desktop" || ["01-landing", "07-dashboard"].includes(file) });
    }
    await ctx.close();
  });
}

test("screenshots variants", async ({ browser }) => {
  test.setTimeout(120_000);
  const shots: [string, string, string, "light" | "dark", Record<string, string>?][] = [
    ["dashboard-dark-rajesh", "/home", "rajesh", "dark"],
    ["dashboard-kisan", "/home", "kisan", "light"],
    ["score-high-contrast-large-text-divya", "/score", "divya", "light", { contrast: "high", textScale: "1.25" }],
  ];
  for (const [file, url, persona, scheme, prefs] of shots) {
    const ctx = await context(browser, VIEWPORTS.desktop, persona, scheme);
    const page = await ctx.newPage();
    if (prefs) await page.addInitScript((p) => localStorage.setItem("vaakya.prefs.v1", JSON.stringify({ textScale: Number(p.textScale), contrast: p.contrast })), prefs);
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${OUT}/variants/${file}.png`, fullPage: true });
    await ctx.close();
  }
  // Assistant showing the honest "not connected" state after a question.
  const ctx = await context(browser, VIEWPORTS.mobile, "priya");
  const page = await ctx.newPage();
  await page.goto("/assistant");
  await page.getByLabel("Your question").fill("Is a ULIP better than term insurance?");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText("Not answered.").waitFor();
  await page.screenshot({ path: `${OUT}/variants/assistant-preview-not-connected-mobile.png`, fullPage: true });
  await ctx.close();
});
