import { describe, expect, it } from "vitest";
import type { Passenger, Search } from "@/lib/session/types";
import { ageInYears, hasErrors, luhn, validatePassengers, validatePayment, validateProfile, validateSearch } from "./rules";

const TODAY = "2026-10-15";
const AIRPORTS = ["DFW", "LAX", "ATL", "ORD"];

const search = (over: Partial<Search> = {}): Search => ({
  origin: "DFW", destination: "LAX", trip_type: "round_trip",
  depart_date: "2026-10-20", return_date: "2026-10-25", passengers: 2, ...over,
});

const passenger = (over: Partial<Passenger> = {}): Passenger => ({
  first_name: "Alex", last_name: "O'Brien", date_of_birth: "1990-05-04", gender: "X",
  special_assistance: "NONE", email: "alex@example.com", phone: "+1 (555) 010-2030",
  terms_accepted: true, ...over,
});

describe("validateSearch", () => {
  it("accepts a valid round trip", () => {
    expect(hasErrors(validateSearch(search(), TODAY, AIRPORTS))).toBe(false);
  });

  it("requires a return date after departure for round trips", () => {
    expect(validateSearch(search({ return_date: null }), TODAY, AIRPORTS).return_date).toBeDefined();
    expect(validateSearch(search({ return_date: "2026-10-19" }), TODAY, AIRPORTS).return_date).toBeDefined();
  });

  it("ignores the return date for one-way trips", () => {
    expect(hasErrors(validateSearch(search({ trip_type: "one_way", return_date: null }), TODAY, AIRPORTS))).toBe(false);
  });

  it("rejects the same airport and dates outside the 30-day window", () => {
    expect(validateSearch(search({ destination: "DFW" }), TODAY, AIRPORTS).destination).toBeDefined();
    expect(validateSearch(search({ depart_date: TODAY }), TODAY, AIRPORTS).depart_date).toBeDefined();
    expect(validateSearch(search({ depart_date: "2026-12-01" }), TODAY, AIRPORTS).depart_date).toBeDefined();
  });

  it("rejects impossible calendar dates", () => {
    expect(validateSearch(search({ depart_date: "2026-02-31" }), TODAY, AIRPORTS).depart_date).toBeDefined();
  });
});

describe("validatePassengers", () => {
  it("accepts a complete primary passenger", () => {
    expect(hasErrors(validatePassengers([passenger()], TODAY))).toBe(false);
  });

  it("flags required names, bad characters, and future birth dates", () => {
    const [errors] = validatePassengers([passenger({ first_name: "", last_name: "R2D2!", date_of_birth: "2030-01-01" })], TODAY);
    expect(errors.first_name).toBe("First name is required.");
    expect(errors.last_name).toMatch(/can only use letters/);
    expect(errors.date_of_birth).toMatch(/future/);
  });

  it("requires contact details and terms only on the primary passenger", () => {
    const [primary, secondary] = validatePassengers(
      [passenger({ email: "", terms_accepted: false }), passenger({ email: "", terms_accepted: false })],
      TODAY,
    );
    expect(primary.email).toBeDefined();
    expect(primary.terms_accepted).toBeDefined();
    expect(secondary.email).toBeUndefined();
  });

  it("computes age in whole years", () => {
    expect(ageInYears("1990-10-16", "2026-10-15")).toBe(35);
    expect(ageInYears("1990-10-15", "2026-10-15")).toBe(36);
  });
});

describe("validatePayment", () => {
  const valid = {
    cardholder_name: "Alex Traveler", card_number: "4111 1111 1111 1111",
    expiry: "12/30", cvv: "123", postal_code: "75001",
  };

  it("accepts a Luhn-valid test number with a future expiry", () => {
    expect(hasErrors(validatePayment(valid, TODAY))).toBe(false);
  });

  it("rejects a bad Luhn checksum, a short CVV, and a bad ZIP", () => {
    const errors = validatePayment({ ...valid, card_number: "4111111111111112", cvv: "12", postal_code: "750" }, TODAY);
    expect(errors.card_number).toBeDefined();
    expect(errors.cvv).toBeDefined();
    expect(errors.postal_code).toBeDefined();
  });

  it("rejects expired cards and malformed expiry", () => {
    expect(validatePayment({ ...valid, expiry: "09/26" }, TODAY).expiry).toMatch(/expired/);
    expect(validatePayment({ ...valid, expiry: "13/30" }, TODAY).expiry).toBeDefined();
  });

  it("checks Luhn directly", () => {
    expect(luhn("4111111111111111")).toBe(true);
    expect(luhn("4111111111111112")).toBe(false);
  });
});

describe("validateProfile", () => {
  const good = { first_name: "Alex", last_name: "Traveler", email: "alex@example.com", phone: "" };

  it("accepts a complete profile with an optional blank phone", () => {
    expect(hasErrors(validateProfile(good))).toBe(false);
  });

  it("requires names and a valid email, and checks phone format when given", () => {
    const errors = validateProfile({ ...good, first_name: "", email: "nope", phone: "abc" });
    expect(errors.first_name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.phone).toBeDefined();
  });
});
