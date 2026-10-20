/**
 * Client-side validation. These rules mirror api/src/Services/Validator.php so the
 * browser and server agree. The server always re-checks everything.
 * Each function returns a map of field name to message. An empty map means valid.
 */
import type { Passenger, ProfileDetails, Search } from "@/lib/session/types";

export type Errors = Record<string, string>;

const NAME = /^[A-Za-z][A-Za-z '\-.]{0,39}$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const EXPIRY = /^(0[1-9]|1[0-2])\/(\d{2})$/;
const POSTAL = /^\d{5}(-\d{4})?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS = ["F", "M", "X", "U", ""];
const ASSISTANCE = ["NONE", "WHEELCHAIR", "VISUAL", "HEARING"];

export const WINDOW_DAYS = 30;

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Mirrors Validator::search(). `today` is a YYYY-MM-DD string in UTC. */
export function validateSearch(input: Search, today: string, airports: string[]): Errors {
  const errors: Errors = {};
  if (!airports.includes(input.origin)) errors.origin = "Choose a departure airport from the list.";
  if (!airports.includes(input.destination)) errors.destination = "Choose an arrival airport from the list.";
  if (input.origin && input.origin === input.destination) errors.destination = "Departure and arrival must be different.";

  const min = addDays(today, 1);
  const max = addDays(today, WINDOW_DAYS);
  if (!isRealDate(input.depart_date) || input.depart_date < min || input.depart_date > max) {
    errors.depart_date = "Choose a departure date within the next 30 days.";
  }

  if (input.trip_type === "round_trip") {
    if (!input.return_date) {
      errors.return_date = "Choose a return date.";
    } else if (!isRealDate(input.return_date) || input.return_date > max) {
      errors.return_date = "Choose a return date within the next 30 days.";
    } else if (input.return_date <= input.depart_date) {
      errors.return_date = "Return must be after departure.";
    }
  }

  if (!Number.isInteger(input.passengers) || input.passengers < 1 || input.passengers > 9) {
    errors.passengers = "Choose between 1 and 9 passengers.";
  }
  return errors;
}

/** Mirrors Validator::passengers(). Contact fields apply to the primary passenger (index 0) only. */
export function validatePassengers(passengers: Passenger[], today: string): Errors[] {
  return passengers.map((p, index) => {
    const errors: Errors = {};

    for (const [field, label] of [["first_name", "First name"], ["last_name", "Last name"]] as const) {
      const value = p[field].trim();
      if (value === "") errors[field] = `${label} is required.`;
      else if (!NAME.test(value)) errors[field] = `${label} can only use letters, spaces, apostrophes, hyphens, and periods.`;
    }

    if (!isRealDate(p.date_of_birth)) errors.date_of_birth = "Enter a valid date of birth.";
    else if (p.date_of_birth > today) errors.date_of_birth = "Date of birth cannot be in the future.";
    else if (ageInYears(p.date_of_birth, today) > 120) {
      errors.date_of_birth = "Enter a date of birth within the last 120 years.";
    }

    if (!GENDERS.includes(p.gender)) errors.gender = "Choose a gender option from the list.";
    if (!ASSISTANCE.includes(p.special_assistance)) errors.special_assistance = "Choose an assistance option from the list.";

    if (index === 0) {
      if (p.email.trim() === "") errors.email = "Enter an email address for confirmations.";
      else if (p.email.length > 254 || !EMAIL.test(p.email.trim())) errors.email = "Enter a valid email address.";

      if (p.phone.trim() !== "" && !PHONE.test(p.phone.trim())) errors.phone = "Enter a valid phone number.";
      if (!p.terms_accepted) errors.terms_accepted = "Accept the terms to continue.";
    }

    return errors;
  });
}

export type PaymentInput = {
  cardholder_name: string;
  card_number: string;
  expiry: string;
  cvv: string;
  postal_code: string;
};

/** Mirrors Validator::payment(). Format checks only. */
export function validatePayment(p: PaymentInput, today: string): Errors {
  const errors: Errors = {};
  const name = p.cardholder_name.trim();
  if (name === "") errors.cardholder_name = "Enter the name on the card.";
  else if (!NAME.test(name)) errors.cardholder_name = "Name can only use letters, spaces, apostrophes, hyphens, and periods.";

  const number = p.card_number.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(number) || !luhn(number)) errors.card_number = "Enter a valid card number.";

  if (!EXPIRY.test(p.expiry)) {
    errors.expiry = "Use the MM/YY format.";
  } else {
    const [month, year] = p.expiry.split("/").map(Number);
    const lastDay = new Date(Date.UTC(2000 + year, month, 0)).toISOString().slice(0, 10);
    if (lastDay < today) errors.expiry = "This card has expired.";
  }

  if (!/^\d{3,4}$/.test(p.cvv)) errors.cvv = "Enter the 3 or 4 digit security code.";
  if (!POSTAL.test(p.postal_code.trim())) errors.postal_code = "Enter a 5 digit ZIP code.";
  return errors;
}

/** Profile contact rules. Same name, email, and phone rules as the passenger form. */
export function validateProfile(p: ProfileDetails): Errors {
  const errors: Errors = {};
  for (const [field, label] of [["first_name", "First name"], ["last_name", "Last name"]] as const) {
    const value = p[field].trim();
    if (value === "") errors[field] = `${label} is required.`;
    else if (!NAME.test(value)) errors[field] = `${label} can only use letters, spaces, apostrophes, hyphens, and periods.`;
  }
  if (p.email.trim() === "") errors.email = "Enter an email address.";
  else if (p.email.length > 254 || !EMAIL.test(p.email.trim())) errors.email = "Enter a valid email address.";
  if (p.phone.trim() !== "" && !PHONE.test(p.phone.trim())) errors.phone = "Enter a valid phone number.";
  return errors;
}

export function luhn(number: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = Number(number[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Whole years between two YYYY-MM-DD dates, matching DateTime::diff()->y on the server. */
export function ageInYears(birth: string, today: string): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let years = ty - by;
  if (tm < bm || (tm === bm && td < bd)) years -= 1;
  return years;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function hasErrors(errors: Errors | Errors[]): boolean {
  return Array.isArray(errors) ? errors.some((e) => Object.keys(e).length > 0) : Object.keys(errors).length > 0;
}
