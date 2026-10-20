import { expect, type Page, test } from "@playwright/test";
import { bookTrip, PASSENGER, reachSeats } from "./flow";

test("round-trip booking completes and appears in the profile", async ({ page }) => {
  await bookTrip(page, "round_trip");

  await page.waitForURL("**/book/confirmation?code=*");
  await expect(page.getByText("Booking confirmed")).toBeVisible();
  const code = await page.locator("span.font-mono").first().innerText();
  expect(code).toMatch(/^UA[A-Z2-9]{6}$/);

  await page.goto("/profile");
  await expect(page.getByText(code)).toBeVisible();
});

test("one-way booking completes with a single leg and appears in the profile", async ({ page }) => {
  await bookTrip(page, "one_way");

  await page.waitForURL("**/book/confirmation?code=*");
  await expect(page.getByText("Booking confirmed")).toBeVisible();
  const code = await page.locator("span.font-mono").first().innerText();
  expect(code).toMatch(/^UA[A-Z2-9]{6}$/);

  await page.goto("/profile");
  await expect(page.getByText(code)).toBeVisible();
  await expect(page.getByText("One-way").first()).toBeVisible();
});

test("passenger form blocks empty submission with field errors", async ({ page }) => {
  await page.goto("/book/search");
  await page.getByRole("button", { name: "Show flights" }).click();
  await page.waitForURL("**/book/flights");
  await page.locator('input[type="radio"][name^="class-"]').first().check();
  await page.getByRole("button", { name: "Choose return" }).click();
  await page.locator('input[type="radio"][name^="class-"]').first().check();
  await page.getByRole("button", { name: "Continue to passengers" }).click();

  await page.waitForURL("**/book/passengers");
  await page.getByRole("button", { name: "Continue to seats" }).click();

  await expect(page.getByText("Please fix the following")).toBeVisible();
  await expect(page.locator("#p0-first-error, #p0-first ~ p").first()).toBeVisible();
  await expect(page).toHaveURL(/\/book\/passengers/);
});

test("header menu opens and closes on small screens", async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width > 768, "Mobile-only check");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(0);
});

/** Fails the first `failures` search calls with a retryable simulated timeout, then lets requests through. */
async function failSearchTimes(page: Page, failures: number) {
  const counter = { calls: 0 };
  await page.route("**/api/v1/search", (route) => {
    counter.calls += 1;
    if (counter.calls > failures) return route.continue();
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        data: null,
        errors: [{ code: "search_timeout", message: "Our flight search is running slowly right now." }],
        meta: {},
        simulated_issue: {
          code: "search_timeout",
          title: "Search is taking longer than usual",
          message: "Our flight search is running slowly right now. Please try again in a moment.",
          retry_allowed: true,
          blocking: true,
        },
      }),
    });
  });
  return counter;
}

test("a search timeout that clears on automatic retry shows no error", async ({ page }) => {
  const search = await failSearchTimes(page, 1);

  await page.goto("/book/search");
  await page.getByRole("button", { name: "Show flights" }).click();
  await page.waitForURL("**/book/flights");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Search is taking longer than usual")).toHaveCount(0);
  // At least the failing call and its retry. The flights page may also search on load, so the exact total is not asserted.
  expect(search.calls).toBeGreaterThanOrEqual(2);
});

test("a search timeout that outlasts automatic retries shows the issue and recovers on try again", async ({ page }) => {
  // The first request plus two automatic retries all fail, so the banner appears.
  const search = await failSearchTimes(page, 3);

  await page.goto("/book/search");
  await page.getByRole("button", { name: "Show flights" }).click();
  await expect(page.getByText("Search is taking longer than usual")).toBeVisible();
  expect(search.calls).toBe(3);

  await page.getByRole("button", { name: "Try again" }).click();
  await page.waitForURL("**/book/flights");
  await page.waitForLoadState("networkidle");
  // Three failing calls, then the successful retry. The flights page may also search on load.
  expect(search.calls).toBeGreaterThanOrEqual(4);
});

test("profile details save and survive a reload", async ({ page }) => {
  await page.goto("/profile");
  await page.locator("#pf-first").fill("Jordan");
  await page.locator("#pf-last").fill("Rivera");
  await page.locator("#pf-email").fill("jordan@example.com");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Your details are saved")).toBeVisible();

  await page.reload();
  await expect(page.locator("#pf-first")).toHaveValue("Jordan");
  await expect(page.locator("#pf-email")).toHaveValue("jordan@example.com");
});

test("no page scrolls sideways on phone widths", async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width > 768, "Phone-width check");
  for (const path of ["/", "/book/search", "/rewards", "/partners", "/profile"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});

test("arrow keys move focus between seats on the seat map", async ({ page, viewport }) => {
  test.skip(!!viewport && viewport.width < 768, "Keyboard check runs on desktop");
  await reachSeats(page);
  const first = page.locator("[data-seat]:not([disabled])").first();
  await first.focus();
  const before = await page.evaluate(() => document.activeElement?.getAttribute("data-seat"));
  await page.keyboard.press("ArrowRight");
  const after = await page.evaluate(() => document.activeElement?.getAttribute("data-seat"));
  expect(after).not.toBe(before);
  expect(after).toBeTruthy();
});

test("seat list view lets a traveler pick a seat by tap or click", async ({ page }) => {
  await reachSeats(page);
  await page.getByRole("button", { name: "List view" }).click();

  const seat = page.locator("[data-list-seat]:not([disabled])").first();
  const code = await seat.getAttribute("data-list-seat");
  expect(code).toBeTruthy();
  await seat.click();

  await expect(page.getByRole("button", { name: new RegExp(`1\\. ${PASSENGER.first} ${PASSENGER.last}`) })).toContainText(code!);
});

for (const model of ["Boeing 757-200", "Airbus A220-100", "Airbus A220-300", "Embraer Praetor 500"]) {
  test(`seat map renders for the ${model}`, async ({ page }) => {
    await reachSeats(page, "one_way", model);
    await expect(page.getByRole("heading", { name: "Choose your seats" })).toBeVisible();

    const seats = page.locator("[data-seat]");
    await expect(seats.first()).toBeVisible();
    expect(await seats.count()).toBeGreaterThan(0);
  });
}

test("a seat map that fails to load marks the Seats step as needing attention", async ({ page }) => {
  await page.route("**/api/v1/flights/*/seatmap", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        data: null,
        errors: [{ code: "seatmap_unavailable", message: "Seat map is unavailable right now." }],
        meta: {},
        simulated_issue: {
          code: "seatmap_unavailable",
          title: "Seat map unavailable",
          message: "Seat map is unavailable right now. Try again, or continue and we will assign seats for you.",
          retry_allowed: false,
          blocking: true,
        },
      }),
    }),
  );

  await reachSeats(page);
  const seatsStep = page.getByRole("navigation", { name: "Booking progress" }).locator("li", { hasText: "Seats" });
  await expect(seatsStep).toContainText("Needs attention");
  await expect(seatsStep).toContainText("Seat map unavailable");
  await expect(page.getByText("Seat map unavailable").first()).toBeVisible();
});
