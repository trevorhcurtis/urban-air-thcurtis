import { expect, test } from "@playwright/test";

/**
 * Visual regression. Full-page screenshots of the main pages at four widths. Baselines are stored
 * next to this file and recorded on the desktop project only, since the widths already cover phone sizes.
 *
 * The browser clock is fixed so the search form's default dates do not change from day to day.
 * Regenerate after an intended visual change: pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
 */
const WIDTHS = [375, 768, 1024, 1440];
const PAGES: [string, string][] = [
  ["home", "/"],
  ["search", "/book/search"],
  ["rewards", "/rewards"],
  ["partners", "/partners"],
  ["help", "/help"],
];
const FIXED_TIME = new Date("2026-10-15T12:00:00Z");

for (const [name, path] of PAGES) {
  for (const width of WIDTHS) {
    test(`${name} at ${width}px matches its baseline`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "visual baselines are recorded on the desktop project");
      await page.clock.setFixedTime(FIXED_TIME);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}
