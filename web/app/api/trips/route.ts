import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { HOLD_SECONDS, MAX_COOKIE_BYTES, TRIPS_COOKIE, sessionSecret, sign, verify } from "@/lib/session/cookie";
import type { Trip } from "@/lib/session/types";

/** Keep the cookie small: only the most recent trips are retained. */
const MAX_TRIPS = 5;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: HOLD_SECONDS,
  secure: process.env.NODE_ENV === "production",
};

async function readTrips(): Promise<Trip[]> {
  const jar = await cookies();
  return verify<Trip[]>(jar.get(TRIPS_COOKIE)?.value, sessionSecret()) ?? [];
}

async function writeTrips(trips: Trip[]): Promise<NextResponse | null> {
  const value = sign(trips.slice(0, MAX_TRIPS), sessionSecret());
  if (value.length > MAX_COOKIE_BYTES) {
    return NextResponse.json({ error: "Too many saved trips to store." }, { status: 413 });
  }
  (await cookies()).set(TRIPS_COOKIE, value, cookieOptions);
  return null;
}

export async function GET() {
  return NextResponse.json({ trips: await readTrips() });
}

/** Saves a confirmed simulated trip. Newest first. */
export async function POST(request: Request) {
  const trip = (await request.json().catch(() => null)) as Trip | null;
  if (!trip?.confirmation_code || !Array.isArray(trip.legs)) {
    return NextResponse.json({ error: "Invalid trip." }, { status: 400 });
  }

  const trips = [trip, ...(await readTrips()).filter((t) => t.confirmation_code !== trip.confirmation_code)];
  const failed = await writeTrips(trips);
  if (failed) return failed;
  return NextResponse.json({ trips: trips.slice(0, MAX_TRIPS) });
}

/** Removes a trip by confirmation code. */
export async function DELETE(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const trips = (await readTrips()).filter((t) => t.confirmation_code !== code);
  const failed = await writeTrips(trips);
  if (failed) return failed;
  return NextResponse.json({ trips });
}
