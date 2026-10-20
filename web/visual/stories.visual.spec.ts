import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Screenshot of every story's root at a fixed width. Covers each primitive state the stories show.
 * Baselines live next to this file. Regenerate after an intended change:
 *   pnpm run visual:stories -- --update-snapshots
 */
const index = JSON.parse(readFileSync(join(__dirname, "..", "storybook-static", "index.json"), "utf8"));
const stories = Object.values<{ id: string; type: string }>(index.entries).filter((e) => e.type === "story");

for (const story of stories) {
  test(`${story.id} matches its baseline`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.id}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    });
  });
}
