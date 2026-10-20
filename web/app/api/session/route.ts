import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { HOLD_SECONDS, MAX_COOKIE_BYTES, SESSION_COOKIE, sessionSecret, sign, verify } from "@/lib/session/cookie";
import { emptySession, sanitizeSession } from "@/lib/session/defaults";
import type { Session } from "@/lib/session/types";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: HOLD_SECONDS,
  secure: process.env.NODE_ENV === "production",
};

async function read(): Promise<Session> {
  const jar = await cookies();
  return verify<Session>(jar.get(SESSION_COOKIE)?.value, sessionSecret()) ?? emptySession();
}

export async function GET() {
  return NextResponse.json({ session: await read() });
}

/** Merges a patch into the session. Only the keys the booking flow uses are accepted. */
export async function PUT(request: Request) {
  const patch = (await request.json().catch(() => null)) as Partial<Session> | null;
  if (!patch || typeof patch !== "object") {
    return NextResponse.json({ error: "Invalid session update." }, { status: 400 });
  }

  const next = sanitizeSession({ ...(await read()), ...patch });
  const value = sign(next, sessionSecret());
  if (value.length > MAX_COOKIE_BYTES) {
    return NextResponse.json({ error: "Your selections are too large to save. Try removing a passenger." }, { status: 413 });
  }

  (await cookies()).set(SESSION_COOKIE, value, cookieOptions);
  return NextResponse.json({ session: next });
}

export async function DELETE() {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return NextResponse.json({ session: emptySession() });
}
