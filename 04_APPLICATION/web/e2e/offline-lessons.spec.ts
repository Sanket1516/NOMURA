import { expect, test } from "@playwright/test";

// Needs the web app started with API_URL pointing at a running API (public lesson endpoints), and E2E_BASE_URL set to the web app.
// Example: API_URL=http://localhost:8000 npx next start -p 3100   then   E2E_BASE_URL=http://localhost:3100 E2E_API=1 npx playwright test e2e/offline-lessons.spec.ts
test.skip(!process.env.E2E_API, "needs the web app connected to a running API");
test.use({ serviceWorkers: "allow" });

test("lessons can be saved, read with no connection, and nothing personal is stored; removing them works", async ({ page, context }) => {
  await page.goto("/lessons");
  await expect(page.getByRole("heading", { level: 1, name: "Lessons" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Emergency Fund" })).toBeVisible();

  // Without pressing the button nothing is stored.
  expect(await page.evaluate(async () => (await caches.keys()).includes("vaakya-lessons-v1"))).toBe(false);

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("button", { name: "Save lessons for offline" }).click();
  await expect(page.getByRole("region", { name: "Read without a connection" }).getByRole("status")).toContainText(/lessons saved on this device/);

  // Only public lesson pages are in the lesson cache; no API, no signed-in page.
  const urls = await page.evaluate(async () => (await (await caches.open("vaakya-lessons-v1")).keys()).map((r) => new URL(r.url).pathname));
  expect(urls.length).toBeGreaterThan(1);
  for (const u of urls) expect(u).toMatch(/^\/lessons(\/[^/]+)?$/);
  const bodies = await page.evaluate(async () => {
    const c = await caches.open("vaakya-lessons-v1");
    return Promise.all((await c.keys()).map(async (r) => (await (await c.match(r))!.text())));
  });
  for (const b of bodies) { expect(b).not.toMatch(/vaakya_sid|access_token|progress_pct|Authorization/i); }

  // Go offline: a saved lesson opens, an unsaved signed-in page shows the offline screen.
  await page.reload();   // make sure the service worker controls the page
  await context.setOffline(true);
  await page.goto("/lessons/emergency-fund");
  await expect(page.getByRole("heading", { level: 1, name: "Emergency Fund" })).toBeVisible();
  await expect(page.getByText("The quiz needs a connection and an account.")).toBeVisible();
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();

  // Remove the saved lessons: offline again shows the offline screen for the lesson too.
  await context.setOffline(false);
  await page.goto("/lessons");
  await page.getByRole("button", { name: "Remove saved lessons" }).click();
  await expect(page.getByRole("region", { name: "Read without a connection" }).getByRole("status")).toContainText(/removed/);
  expect(await page.evaluate(async () => (await caches.keys()).includes("vaakya-lessons-v1"))).toBe(false);
  await context.setOffline(true);
  await page.goto("/lessons/emergency-fund");
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
});
