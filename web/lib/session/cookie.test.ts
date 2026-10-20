import { describe, expect, it } from "vitest";
import { HOLD_SECONDS, sign, verify } from "./cookie";

const SECRET = "x".repeat(40);
const T0 = 1_700_000_000_000;

describe("signed cookie payloads", () => {
  it("round-trips a payload within the hold window", () => {
    const value = sign({ a: 1 }, SECRET, T0);
    expect(verify<{ a: number }>(value, SECRET, T0 + 1000)).toEqual({ a: 1 });
  });

  it("rejects a tampered payload", () => {
    const [body, mac] = sign({ a: 1 }, SECRET, T0).split(".");
    const forged = Buffer.from(JSON.stringify({ issuedAt: T0, data: { a: 2 } })).toString("base64url");
    expect(verify(`${forged}.${mac}`, SECRET, T0)).toBeNull();
    expect(verify(`${body}.${mac}`, SECRET, T0)).not.toBeNull();
  });

  it("rejects a value signed with a different secret", () => {
    expect(verify(sign({ a: 1 }, SECRET, T0), "y".repeat(40), T0)).toBeNull();
  });

  it("expires after the 24-hour hold", () => {
    const value = sign({ a: 1 }, SECRET, T0);
    expect(verify(value, SECRET, T0 + HOLD_SECONDS * 1000 - 1)).not.toBeNull();
    expect(verify(value, SECRET, T0 + HOLD_SECONDS * 1000)).toBeNull();
  });

  it("returns null for missing or malformed values", () => {
    expect(verify(undefined, SECRET)).toBeNull();
    expect(verify("not-a-cookie", SECRET)).toBeNull();
    expect(verify("", SECRET)).toBeNull();
  });
});
