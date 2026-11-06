import { chromium, expect, test } from "@playwright/test";
import path from "node:path";

// Live voice round trip through the real stack: browser MediaRecorder (webm/opus) -> /v1/voice/query -> Whisper on the GPU ->
// orchestrator -> eSpeak -> <audio>. The microphone is Chromium's fake device playing a fixture clip (synthetic eSpeak speech,
// see 05_TESTING/fixtures/voice/README.md). Run: LIVE_E2E=1 E2E_BASE_URL=https://localhost DEMO_PASSWORD=... npx playwright test e2e/voice.spec.ts
test.skip(!process.env.LIVE_E2E, "live stack only");
test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const FIX = path.resolve(__dirname, "../../../05_TESTING/fixtures/voice");

for (const [lang, expectText] of [["en", /save|month/i], ["hi", null], ["mr", null], ["kn", null]] as const) {
  test(`voice round trip, ${lang}`, async () => {
    const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${FIX}/${lang}.wav`] });
    try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, permissions: ["microphone"], baseURL: BASE, viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([{ name: "vaakya_lang", value: "en", url: BASE }]);
    const page = await ctx.newPage();
    const problems: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400 && r.url().includes("/voice")) problems.push(`${r.status()} ${r.url()}`); });
    await page.goto("/login");
    await page.locator("a[href=\"/api/auth/login\"]").click();
    await page.locator("#username").fill("demo-priya@vaakya.invalid");
    await page.locator("#password").fill(process.env.DEMO_PASSWORD!);
    await page.locator("#kc-login").click();
    await page.waitForURL(/\/(home|onboarding)/);
    await page.goto("/voice");
    await page.getByLabel(/Speech language|Language/i).first().selectOption(lang).catch(() => undefined);
    await page.getByRole("button", { name: "Start speaking" }).click();
    await page.waitForTimeout(3500);
    const t0 = Date.now();
    const req = page.waitForResponse((r) => r.url().includes("/v1/voice/query"), { timeout: 100_000 });
    await page.getByRole("button", { name: "Stop and send" }).click();
    const res = await req;
    const ms = Date.now() - t0;
    console.log(`voice ${lang}: HTTP ${res.status()} in ${ms} ms`);
    expect(res.status(), await res.text()).toBe(200);
    const body = await res.json();
    console.log(`  transcript: ${JSON.stringify(body.transcript.text)}  agents: ${body.answer.ai.agents}  llm_used: ${body.answer.ai.llm_used}  translated: ${body.answer.ai.translated}`);
    if (expectText) expect(body.transcript.text).toMatch(expectText);
    const audio = page.locator("audio").first();
    await expect(audio).toBeVisible({ timeout: 15_000 });
    const src = await audio.getAttribute("src");
    const a = await page.request.get(src!);
    expect(a.status()).toBe(200);
    expect(a.headers()["content-type"]).toContain("audio/wav");
    expect((await a.body()).subarray(0, 4).toString()).toBe("RIFF");
    expect(problems.filter((p) => !/favicon|SSL certificate error occurred when fetching the script/.test(p))).toEqual([]);
    } finally { await browser.close(); }
  });
}
