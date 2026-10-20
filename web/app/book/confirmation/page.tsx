"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BoardingPass } from "@/components/booking/BoardingPass";
import { money } from "@/lib/format";
import type { Trip } from "@/lib/session/types";
import { Heading } from "@/components/ui/Heading";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 text-text-muted">Loading your confirmation…</main>}>
      <Confirmation />
    </Suspense>
  );
}

function Confirmation() {
  const code = useSearchParams().get("code") ?? "";
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/trips", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { trips: Trip[] }) => setTrip(json.trips.find((t) => t.confirmation_code === code) ?? null))
      .catch(() => setTrip(null));
  }, [code]);

  if (trip === undefined) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 text-text-muted">Loading your confirmation…</main>;
  }

  if (trip === null) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 space-y-4">
        <Alert tone="warning" title="We could not find that confirmation">
          It may have expired after 24 hours. Start a new booking, or check your trips in your profile.
        </Alert>
        <ButtonLink href="/profile" variant="secondary">View trips</ButtonLink>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-text-accent">Booking confirmed</p>
      <Heading level={1} size={2} brand className="mt-1">You are going. Fly Further Together.</Heading>
      <p className="mt-3 text-text-muted">
        Confirmation code <span className="font-mono text-lg font-semibold text-text-primary">{trip.confirmation_code}</span>
      </p>

      <section aria-labelledby="trip-heading" className="mt-8 space-y-4">
        <Heading level={2} size={4} id="trip-heading">Your itinerary</Heading>
        {trip.legs.map((leg, i) => (
          <BoardingPass
            key={i}
            direction={i === 0 ? "Outbound" : "Return"}
            leg={leg}
            seats={i === 0 ? trip.seats.outbound : trip.seats.return}
            passengers={trip.passengers.map((p) => `${p.first_name} ${p.last_name}`)}
          />
        ))}
        <p className="text-sm text-text-primary">Passengers: {trip.passengers.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}</p>
        <p className="text-sm text-text-primary">Total paid (simulated): <span className="font-semibold">{money(trip.total_cents)}</span></p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/profile">See my trips</ButtonLink>
        <Button variant="secondary" onClick={() => window.print()}>
          Print itinerary
        </Button>
      </div>

      <section aria-labelledby="deals-heading" className="mt-12">
        <Heading level={2} size={4} id="deals-heading">Trip extras</Heading>
        <p className="mt-1 text-sm text-text-muted">Car rental and vacation packages are not part of this prototype.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Car rental", "Vacation packages"].map((item) => (
            <li key={item} className="rounded-md border border-dashed border-border-default p-4 text-sm text-text-muted">
              {item}: coming soon
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-text-muted">
        Need to start over? <Link href="/book/search" className="font-semibold text-text-link underline-offset-4 hover:underline">Book another trip</Link>.
      </p>
    </main>
  );
}
