"use client";

import { Heading } from "@/components/ui/Heading";
import { FareCard, type Baggage, type Restriction } from "@/components/booking/FareCard";
import { Tooltip } from "@/components/ui/Tooltip";
import { duration, formatTime, shortDate } from "@/lib/format";

export type ClassOption = {
  code: string;
  label: string;
  price_cents: number;
  seats_total: number;
  seats_open: number;
  available: boolean;
  baggage: Baggage;
  restrictions: Restriction[];
};

export type FlightOption = {
  id: number;
  flight_number: string;
  flight_date: string;
  depart_time: string;
  arrive_time: string;
  duration_min: number;
  route: { origin: string; destination: string };
  aircraft: { tail_number: string; name: string; manufacturer: string; model: string; type_code: string };
  classes: ClassOption[];
};

/** One flight with its class choices. Aircraft and class details appear on hover or tap. */
export function FlightCard({
  flight,
  selected,
  selectedClass,
  onClassChange,
  passengers,
}: {
  flight: FlightOption;
  selected: boolean;
  selectedClass: string | null;
  onClassChange: (code: string) => void;
  passengers: number;
}) {
  const options = flight.classes.filter((c) => c.available);
  const headingId = `flight-${flight.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className={`rounded-lg border p-5 transition-colors ${selected ? "border-border-interactive bg-surface-brand/50 ring-2 ring-border-focus/30" : "border-border-subtle bg-surface-canvas"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level={3} size={4} id={headingId}>
            {flight.flight_number}
            <span className="ml-2 text-sm font-normal text-text-muted">{shortDate(flight.flight_date)}</span>
          </Heading>
          <p className="text-sm text-text-muted">
            {flight.route.origin} → {flight.route.destination}
          </p>
        </div>
        {selected && <span className="rounded-full bg-surface-interactive px-3 py-1 text-xs font-semibold text-text-inverse">Selected</span>}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-text-muted">Departs</dt>
          <dd className="font-semibold text-text-primary">{formatTime(flight.depart_time)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Arrives</dt>
          <dd className="font-semibold text-text-primary">{formatTime(flight.arrive_time)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Duration</dt>
          <dd className="font-semibold text-text-primary">{duration(flight.duration_min)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-text-primary">
        <Tooltip content={`Tail ${flight.aircraft.tail_number}. ${flight.aircraft.manufacturer} ${flight.aircraft.model}.`}>
          {flight.aircraft.name}
        </Tooltip>
        <span className="text-text-muted"> · {flight.aircraft.manufacturer} {flight.aircraft.model}</span>
      </p>

      {options.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-text-error">
          Not enough seats for {passengers} {passengers === 1 ? "passenger" : "passengers"} on this flight.
        </p>
      ) : (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold text-text-primary">Choose a class</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((c) => (
              <FareCard
                key={c.code}
                name={`class-${flight.id}`}
                option={c}
                checked={selected && selectedClass === c.code}
                onChange={() => onClassChange(c.code)}
                tooltip={classTooltip(c.code)}
              />
            ))}
          </div>
        </fieldset>
      )}
    </article>
  );
}

function classTooltip(code: string): string {
  if (code === "BUSINESS") return "Business: wider seats, power at every seat, priority boarding, and two checked bags included.";
  if (code === "PREMIUM") return "Premium Economy: extra legroom, a wider recline, and one checked bag included.";
  return "Economy: comfortable seating with one carry-on included. Checked bags are available for a fee.";
}
