import { createHmac, timingSafeEqual } from "node:crypto";

/** The 24-hour hold from the prototype spec. */
export const HOLD_SECONDS = 86400;
export const SESSION_COOKIE = "ua_session";
export const TRIPS_COOKIE = "ua_trips";
export const PROFILE_COOKIE = "ua_profile";

/** Browsers cap a cookie at about 4 KB, so writes above this size are rejected. */
export const MAX_COOKIE_BYTES = 3800;

type Envelope<T> = { issuedAt: number; data: T };

function mac(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

/** Signs a payload and stamps it with the issue time. */
export function sign<T>(data: T, secret: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ issuedAt: now, data } satisfies Envelope<T>)).toString("base64url");
  return `${body}.${mac(body, secret)}`;
}

/** Returns the payload, or null if the signature is wrong, the value is malformed, or the hold has expired. */
export function verify<T>(value: string | undefined, secret: string, now = Date.now()): T | null {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = mac(body, secret);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Envelope<T>;
    if (typeof parsed.issuedAt !== "number" || now - parsed.issuedAt >= HOLD_SECONDS * 1000) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/** Reads the signing secret. Fails loudly so an unset secret never ships. */
export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters (see web/.env.example).");
  }
  return secret;
}
