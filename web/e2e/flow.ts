import { expect, type Page } from "@playwright/test";

export const PASSENGER = { first: "Alex", last: "Traveler", dob: "1990-05-04", email: "alex@example.com" };
export const CARD = { name: "Alex Traveler", number: "4111 1111 1111 1111", expiry: "12/30", cvv: "123", zip: "75001" };

export type TripType = "round_trip" | "one_way";

/**
 * Walks from search to the seat map for the outbound leg, with one passenger. Picks the first
 * flight with a class, or the first flight flown by `aircraftModel` (e.g. "Airbus A220-100").
 */
export async function reachSeats(page: Page, tripType: TripType = "round_trip", aircraftModel?: string) {
  await page.goto("/book/search");
  if (tripType === "one_way") {
    // The radio input is visually hidden behind its label, so click the label as a user would.
    await page.getByText("One-way", { exact: true }).click();
    await expect(page.getByLabel("Return date")).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "Show flights" })).toBeEnabled();
  await page.getByRole("button", { name: "Show flights" }).click();

  // Outbound: choose the flight (or the first flight of the model) with a class.
  await page.waitForURL("**/book/flights");
  const flight = aircraftModel ? page.locator("li").filter({ hasText: aircraftModel }).first() : page;
  await flight.locator('input[type="radio"][name^="class-"]').first().check();

  if (tripType === "round_trip") {
    // Return: pick the first flight with a class.
    await page.getByRole("button", { name: "Choose return" }).click();
    await page.locator('input[type="radio"][name^="class-"]').first().check();
  }
  await page.getByRole("button", { name: "Continue to passengers" }).click();

  await page.waitForURL("**/book/passengers");
  await page.locator("#p0-first").fill(PASSENGER.first);
  await page.locator("#p0-last").fill(PASSENGER.last);
  await page.locator("#p0-dob").fill(PASSENGER.dob);
  await page.locator("#p0-email").fill(PASSENGER.email);
  await page.getByLabel(/I agree to the Urban Air/).check();
  await page.getByRole("button", { name: "Continue to seats" }).click();

  await page.waitForURL("**/book/seats");
}

/** Books a full trip, with seats auto-assigned on every leg, and pays with the test card. */
export async function bookTrip(page: Page, tripType: TripType) {
  await reachSeats(page, tripType);
  await page.getByRole("button", { name: "Assign seats for me" }).click();

  if (tripType === "round_trip") {
    await page.getByRole("button", { name: "Continue to return seats" }).click();
    await page.getByRole("button", { name: "Assign seats for me" }).click();
  }
  await page.getByRole("button", { name: "Review your trip" }).click();

  await page.waitForURL("**/book/review");
  await page.getByLabel("Name on card").fill(CARD.name);
  await page.getByLabel("Card number").fill(CARD.number);
  await page.getByLabel("Expiry (MM/YY)").fill(CARD.expiry);
  await page.getByLabel("Security code").fill(CARD.cvv);
  await page.getByLabel("Billing ZIP code").fill(CARD.zip);
  await page.getByRole("button", { name: /Pay .* and confirm/ }).click();
}
