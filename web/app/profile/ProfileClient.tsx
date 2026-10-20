"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { SortBar, type SortState } from "@/components/ui/SortBar";
import { DetailsForm } from "./DetailsForm";
import { FlightStatusPanel } from "@/components/booking/FlightStatusPanel";
import { api } from "@/lib/api/client";
import { formatTime, money, shortDate } from "@/lib/format";
import { FLIGHT_STATUS, type FlightStatusCode } from "@/lib/flightStatus";
import { sortItems } from "@/lib/sort";
import type { Trip } from "@/lib/session/types";
import { Heading } from "@/components/ui/Heading";

type Tier = { code: string; name: string; min_points: number; benefits: string };

/** Starting points for the prototype so every tier can be seen. Not a real balance. */
const STARTING_POINTS = 2500;

const SORT_KEYS = [
  { key: "date", label: "Travel date" },
  { key: "total", label: "Total paid" },
  { key: "code", label: "Confirmation code" },
];

const ACCESSORS = {
  date: (t: Trip) => t.legs[0]?.flight_date ?? "",
  total: (t: Trip) => t.total_cents,
  code: (t: Trip) => t.confirmation_code,
};

export function ProfileClient({ tiers }: { tiers: Tier[] }) {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "asc" });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Live status per flight id. Missing means still loading. Null means it could not be loaded. */
  const [statuses, setStatuses] = useState<Record<number, FlightStatusCode | null>>({});

  useEffect(() => {
    fetch("/api/trips", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { trips: Trip[] }) => setTrips(json.trips))
      .catch(() => setError("We could not load your trips. Refresh the page to try again."));
  }, []);

  useEffect(() => {
    if (!trips) return;
    let active = true;
    const ids = [...new Set(trips.flatMap((t) => t.legs.map((l) => l.flight_id)))];
    for (const id of ids) {
      api<{ flight: { status: string } }>(`/flights/${id}`, { autoRetry: 2 }).then((res) => {
        const code = res.data?.flight.status;
        const known = code !== undefined && code in FLIGHT_STATUS ? (code as FlightStatusCode) : null;
        if (active) setStatuses((s) => ({ ...s, [id]: known }));
      });
    }
    return () => {
      active = false;
    };
  }, [trips]);

  const today = new Date().toISOString().slice(0, 10);
  const sorted = useMemo(() => sortItems(trips ?? [], sort, ACCESSORS), [trips, sort]);

  const points = useMemo(
    () => STARTING_POINTS + (trips ?? []).reduce((sum, t) => sum + Math.floor(t.base_fare_cents / 100), 0),
    [trips],
  );
  const tier = [...tiers].reverse().find((t) => points >= t.min_points) ?? tiers[0];
  const next = tiers.find((t) => t.min_points > points);
  const progress = next && tier ? Math.min(100, Math.round(((points - tier.min_points) / (next.min_points - tier.min_points)) * 100)) : 100;

  async function cancel(code: string) {
    const res = await fetch(`/api/trips?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    const json = (await res.json()) as { trips?: Trip[] };
    if (res.ok && json.trips) setTrips(json.trips);
    else setError("We could not cancel that trip. Please try again.");
    setConfirming(null);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Your trips and rewards</Heading>
      <p className="mt-2 text-text-muted">Trips you book here are kept in this browser for 24 hours.</p>

      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      <section aria-labelledby="rewards-heading" className="mt-8 rounded-lg bg-surface-inverse p-6 text-text-inverse">
        <h2 id="rewards-heading" className="text-sm font-semibold uppercase tracking-wide text-text-inverse">Urban Air Rewards</h2>
        <p className="mt-2 text-h2 font-bold">{points.toLocaleString("en-US")} points</p>
        {tier && <p className="mt-1 text-text-inverse">{tier.name} tier · {tier.benefits}</p>}
        {next && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-surface-canvas/20" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`Progress to ${next.name}`}>
              <div className="h-full bg-surface-accent" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-text-inverse">{(next.min_points - points).toLocaleString("en-US")} points to {next.name}</p>
          </div>
        )}
        <Link href="/rewards" className="mt-4 inline-block text-sm font-semibold underline-offset-4 hover:underline">How rewards work</Link>
      </section>

      <DetailsForm />

      <section aria-labelledby="trips-heading" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="trips-heading" className="text-h4 font-semibold text-text-primary">Booked trips</h2>
          <SortBar keys={SORT_KEYS} value={sort} onChange={setSort} />
        </div>

        {trips === null && !error && <p role="status" className="mt-6 text-text-muted">Loading trips…</p>}

        {trips !== null && trips.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-border-subtle p-8 text-center">
            <p className="text-text-primary">No trips yet.</p>
            <div className="mt-4"><ButtonLink href="/book/search">Book a flight</ButtonLink></div>
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {sorted.map((trip) => {
            const first = trip.legs[0];
            const upcoming = first.flight_date >= today;
            return (
              <li key={trip.confirmation_code} className="rounded-lg border border-border-subtle p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-text-primary">{trip.confirmation_code}</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {first.origin} → {first.destination}
                      {trip.search.trip_type === "round_trip" ? " → " + first.origin : ""}
                    </p>
                    <p className="text-sm text-text-muted">
                      {shortDate(first.flight_date)} · {formatTime(first.depart_time)} · {trip.legs.length === 2 ? "Round-trip" : "One-way"} · {trip.passengers.length} {trip.passengers.length === 1 ? "passenger" : "passengers"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${upcoming ? "bg-surface-accent/15 text-text-accent" : "bg-border-subtle/40 text-text-primary"}`}>
                    {upcoming ? "Upcoming" : "Past"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-text-primary">
                  {trip.legs.map((l) => `${l.flight_number} ${l.class_label}`).join(" · ")} · Total {money(trip.total_cents)}
                </p>

                <FlightStatusPanel
                  legs={trip.legs.map((l) => ({ flight_number: l.flight_number, status: l.flight_id in statuses ? statuses[l.flight_id] : undefined }))}
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  {confirming === trip.confirmation_code ? (
                    <>
                      <p className="text-sm text-text-primary">Remove this trip from this browser?</p>
                      <button type="button" onClick={() => cancel(trip.confirmation_code)} className="min-h-control-md rounded-md bg-surface-destructive px-4 text-sm font-semibold text-text-inverse">Yes, remove</button>
                      <button type="button" onClick={() => setConfirming(null)} className="min-h-control-md rounded-md border border-border-default px-4 text-sm font-semibold text-text-primary">Keep trip</button>
                    </>
                  ) : (
                    <>
                      <Link href={`/book/confirmation?code=${trip.confirmation_code}`} className="inline-flex min-h-control-md items-center rounded-md border border-border-brand px-4 text-sm font-semibold text-text-primary hover:bg-surface-brand">View details</Link>
                      <button type="button" onClick={() => setConfirming(trip.confirmation_code)} className="min-h-control-md rounded-md px-4 text-sm font-semibold text-text-error hover:bg-surface-error">Cancel trip</button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
