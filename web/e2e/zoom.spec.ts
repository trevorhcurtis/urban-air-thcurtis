import { expect, type Page, test } from "@playwright/test";
import { reachSeats } from "./flow";

/**
 * Reflow and long-label checks. 200% zoom on a 1280 px screen is about 640 CSS px. WCAG 1.4.10
 * (reflow) requires content to work at 320 CSS px, so both widths are checked.
 */
const WIDTHS = [320, 640];
const PAGES = ["/", "/book/search", "/rewards", "/partners", "/profile", "/help"];

/** Returns how far each page is wider than its viewport, and any visible element that spills past the edge. */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const pageOverflow = document.documentElement.scrollWidth - width;
    // Elements inside a deliberate scroll container (the seat deck) may extend past the edge by design.
    const spills = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        if (el.closest(".overflow-x-auto")) return false;
        return r.right > width + 1;
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    return { pageOverflow, spills };
  });
}

for (const width of WIDTHS) {
  test(`public pages reflow without sideways scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const result = await overflow(page);
      expect(result.pageOverflow, `page overflow on ${path} at ${width}px`).toBeLessThanOrEqual(1);
      expect(result.spills, `elements past the edge on ${path} at ${width}px`).toEqual([]);
    }
  });
}

test("long names, emails, and error messages wrap on the passenger form at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await reachSeats(page);
  // reachSeats leaves the traveler on the seat map. Go back to passengers to fill the form.
  await page.goto("/book/passengers");
  await page.waitForLoadState("networkidle");

  const longName = "Maximilian Alexander Konstantinopoulos-Fitzgerald the Third";
  const longEmail = "a.very.long.address.for.testing.reflow.behaviour@subdomain.example-airline.test";
  await page.locator("#p0-first").fill(longName);
  await page.locator("#p0-last").fill(longName);
  await page.locator("#p0-email").fill(longEmail);
  await page.locator("#p0-dob").fill("2000-01-01");
  await page.getByRole("button", { name: "Continue to seats" }).click();

  await page.locator("#p0-email").fill(`${longEmail}.${"x".repeat(80)}`);
  const result = await overflow(page);
  expect(result.pageOverflow, "passenger form overflow at 320px").toBeLessThanOrEqual(1);
  expect(result.spills, "passenger form elements past the edge at 320px").toEqual([]);

  // Inputs stay inside the viewport, and the field's own width does not grow past the page.
  const box = await page.locator("#p0-email").boundingBox();
  expect(box && box.x + box.width <= 320 + 1).toBe(true);

  // Every visible error message and label must wrap inside the viewport. Fail if none are shown,
  // so the test cannot pass without checking anything.
  const messages = page.locator('[id$="-error"], label');
  const count = await messages.count();
  expect(count, "labels and error messages on the form").toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const item = messages.nth(i);
    if (!(await item.isVisible())) continue;
    const r = await item.boundingBox();
    expect(r && r.x + r.width <= 320 + 1, `text past the edge: ${(await item.textContent())?.slice(0, 40)}`).toBe(true);
  }
});
