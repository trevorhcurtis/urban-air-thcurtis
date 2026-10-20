import { readFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated WCAG 2.x A and AA scan of every story, in the same way e2e/accessibility.spec.ts scans pages.
 * Fails on any serious or critical violation. Runs on the stories config after a Storybook build.
 */
const index = JSON.parse(readFileSync(join(__dirname, "..", "storybook-static", "index.json"), "utf8"));
const stories = Object.values<{ id: string; type: string }>(index.entries).filter((e) => e.type === "story");

for (const story of stories) {
  test(`${story.id} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`),
      `violations in ${story.id}`,
    ).toEqual([]);
  });
}
