import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end runs against a production build of the web app and the PHP API.
 * Simulated errors are off here so the happy paths are deterministic. The
 * error-handling behavior is covered by the PHP tests.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "php -S 127.0.0.1:8080 -t public",
      cwd: "../api",
      url: "http://127.0.0.1:8080/api/v1/meta/status",
      // Always start a fresh API so the flags above apply. A stale server would bring its own settings.
      reuseExistingServer: false,
      // Rate limiting is covered by PHPUnit. Turned off here so a full run can't hit it.
      env: { SIMULATE_ERRORS: "false", RATE_LIMIT_PER_MINUTE: "0" },
    },
    {
      command: "pnpm start -p 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
    },
  ],
});
