import { describe, expect, it } from "vitest";
import { emptySession, sanitizeSession } from "./defaults";

describe("sanitizeSession", () => {
  it("returns an empty session for junk input", () => {
    expect(sanitizeSession(null)).toEqual(emptySession());
    expect(sanitizeSession("hello")).toEqual(emptySession());
  });

  it("drops unknown keys", () => {
    const result = sanitizeSession({ search: null, admin: true, card_number: "4111" });
    expect(result).not.toHaveProperty("admin");
    expect(result).not.toHaveProperty("card_number");
  });

  it("caps passengers at nine and keeps only string seat codes", () => {
    const many = Array.from({ length: 12 }, () => ({ first_name: "A" }));
    const result = sanitizeSession({ passengers: many, seats: { outbound: ["1A", 2, "3C"] } });
    expect(result.passengers).toHaveLength(9);
    expect(result.seats.outbound).toEqual(["1A", "3C"]);
  });
});
