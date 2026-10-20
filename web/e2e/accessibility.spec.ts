import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { CARD, PASSENGER } from "./flow";

/**
 * Automated WCAG 2.x A and AA scan. Fails on any serious or critical violation.
 * Each page is scanned at phone, tablet, laptop, and desktop widths (guidance section 13: responsive QA).
 */
const WIDTHS = [375, 768, 1024, 1440];
const PUBLIC_PAGES = ["/", "/rewards", "/partners", "/profile", "/help"];

async function scan(page: Page, label: string) {
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`),
    `violations on ${label}`,
  ).toEqual([]);
}

for (const path of PUBLIC_PAGES) {
  test(`no serious accessibility violations on ${path} at four widths`, async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await scan(page, `${path} at ${width}px`);
    }
  });
}

test("no serious accessibility violations through the round-trip booking pages at four widths", async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });

    await page.goto("/book/search");
    await scan(page, `search at ${width}px`);
    await page.getByRole("button", { name: "Show flights" }).click();

    await page.waitForURL("**/book/flights");
    await scan(page, `flights at ${width}px`);
    await page.locator('input[type="radio"][name^="class-"]').first().check();
    await page.getByRole("button", { name: "Choose return" }).click();
    await page.locator('input[type="radio"][name^="class-"]').first().check();
    await page.getByRole("button", { name: "Continue to passengers" }).click();

    await page.waitForURL("**/book/passengers");
    await page.locator("#p0-first").fill(PASSENGER.first);
    await page.locator("#p0-last").fill(PASSENGER.last);
    await page.locator("#p0-dob").fill(PASSENGER.dob);
    await page.locator("#p0-email").fill(PASSENGER.email);
    await page.getByLabel(/I agree to the Urban Air/).check();
    await scan(page, `passengers at ${width}px`);
    await page.getByRole("button", { name: "Continue to seats" }).click();

    await page.waitForURL("**/book/seats");
    await scan(page, `seats at ${width}px`);
    await page.getByRole("button", { name: "Assign seats for me" }).click();
    await page.getByRole("button", { name: "Continue to return seats" }).click();
    await page.getByRole("button", { name: "Assign seats for me" }).click();
    await page.getByRole("button", { name: "Review your trip" }).click();

    await page.waitForURL("**/book/review");
    await scan(page, `review at ${width}px`);
  }
});

test("no serious accessibility violations through the one-way booking pages, confirmation included, at four widths", async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });

    await page.goto("/book/search");
    await page.getByText("One-way", { exact: true }).click();
    await scan(page, `one-way search at ${width}px`);
    await page.getByRole("button", { name: "Show flights" }).click();

    await page.waitForURL("**/book/flights");
    await scan(page, `one-way flights at ${width}px`);
    await page.locator('input[type="radio"][name^="class-"]').first().check();
    await page.getByRole("button", { name: "Continue to passengers" }).click();

    await page.waitForURL("**/book/passengers");
    await page.locator("#p0-first").fill(PASSENGER.first);
    await page.locator("#p0-last").fill(PASSENGER.last);
    await page.locator("#p0-dob").fill(PASSENGER.dob);
    await page.locator("#p0-email").fill(PASSENGER.email);
    await page.getByLabel(/I agree to the Urban Air/).check();
    await scan(page, `one-way passengers at ${width}px`);
    await page.getByRole("button", { name: "Continue to seats" }).click();

    await page.waitForURL("**/book/seats");
    await scan(page, `one-way seats at ${width}px`);
    await page.getByRole("button", { name: "Assign seats for me" }).click();
    await page.getByRole("button", { name: "Review your trip" }).click();

    await page.waitForURL("**/book/review");
    await scan(page, `one-way review at ${width}px`);
    await page.getByLabel("Name on card").fill(CARD.name);
    await page.getByLabel("Card number").fill(CARD.number);
    await page.getByLabel("Expiry (MM/YY)").fill(CARD.expiry);
    await page.getByLabel("Security code").fill(CARD.cvv);
    await page.getByLabel("Billing ZIP code").fill(CARD.zip);
    await page.getByRole("button", { name: /Pay .* and confirm/ }).click();

    await page.waitForURL("**/book/confirmation?code=*");
    await expect(page.getByText("Booking confirmed")).toBeVisible();
    await scan(page, `confirmation at ${width}px`);
  }
});
