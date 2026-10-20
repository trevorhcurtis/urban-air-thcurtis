import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { HOLD_SECONDS, MAX_COOKIE_BYTES, PROFILE_COOKIE, sessionSecret, sign, verify } from "@/lib/session/cookie";
import type { ProfileDetails } from "@/lib/session/types";
import { hasErrors, validateProfile } from "@/lib/validation/rules";

const EMPTY: ProfileDetails = { first_name: "", last_name: "", email: "", phone: "" };

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: HOLD_SECONDS,
  secure: process.env.NODE_ENV === "production",
};

export async function GET() {
  const jar = await cookies();
  const profile = verify<ProfileDetails>(jar.get(PROFILE_COOKIE)?.value, sessionSecret()) ?? EMPTY;
  return NextResponse.json({ profile });
}

/** Saves contact details. Validated here as well as in the browser. Only four fields are kept. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ProfileDetails> | null;
  const profile: ProfileDetails = {
    first_name: String(body?.first_name ?? "").slice(0, 40),
    last_name: String(body?.last_name ?? "").slice(0, 40),
    email: String(body?.email ?? "").slice(0, 254),
    phone: String(body?.phone ?? "").slice(0, 20),
  };

  const errors = validateProfile(profile);
  if (hasErrors(errors)) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const value = sign(profile, sessionSecret());
  if (value.length > MAX_COOKIE_BYTES) {
    return NextResponse.json({ error: "Profile details are too large to save." }, { status: 413 });
  }
  (await cookies()).set(PROFILE_COOKIE, value, cookieOptions);
  return NextResponse.json({ profile });
}
