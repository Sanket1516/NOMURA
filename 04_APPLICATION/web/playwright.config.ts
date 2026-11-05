import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`, trace: "off" },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    env: { APP_URL: `http://localhost:${PORT}`, PREVIEW_MODE: "on" },
  },
});
