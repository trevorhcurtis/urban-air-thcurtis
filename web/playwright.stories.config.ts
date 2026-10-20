import { defineConfig, devices } from "@playwright/test";

/**
 * Visual baselines for each Storybook story (every primitive state). Separate from the main config,
 * so the end-to-end run does not need a Storybook build. Run `pnpm run visual:stories`, which builds
 * Storybook first.
 */
export default defineConfig({
  testDir: "./visual",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:6108", trace: "retain-on-failure" },
  projects: [{ name: "stories", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } } }],
  webServer: {
    command: "python3 -m http.server 6108 --directory storybook-static --bind 127.0.0.1",
    url: "http://127.0.0.1:6108/index.json",
    reuseExistingServer: false,
  },
});
