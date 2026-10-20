"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/Input";
import type { Search, TripType } from "@/lib/session/types";
import type { Errors } from "@/lib/validation/rules";
import { AirportCombobox, type AirportOption } from "./AirportCombobox";
import { PassengerSelector } from "./PassengerSelector";

/**
 * The flight search form: trip type, route, dates, and passengers. The page owns the values and the
 * validation. The panel shows them, reports changes, and submits. The route swap is part of the panel.
 */
export function FlightSearchPanel({
  form,
  errors,
  origins,
  destinations,
  ready,
  submitting,
  minDate,
  maxDate,
  onChange,
  onSwap,
  onSubmit,
}: {
  form: Search;
  errors: Errors;
  origins: AirportOption[];
  destinations: AirportOption[];
  ready: boolean;
  submitting: boolean;
  minDate: string;
  maxDate: string;
  onChange: <K extends keyof Search>(key: K, value: Search[K]) => void;
  onSwap: () => void;
  onSubmit: (event?: FormEvent) => void;
}) {
  const roundTrip = form.trip_type === "round_trip";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6" aria-label="Flight search">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-text-primary">Trip type</legend>
        <div className="flex gap-3" role="radiogroup">
          {(["round_trip", "one_way"] as TripType[]).map((t) => (
            <label key={t} className={`inline-flex min-h-control-md cursor-pointer items-center justify-center rounded-full border px-5 py-2 text-sm font-mediumhas-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-focus ${form.trip_type === t ? "border-border-interactive bg-surface-interactive text-text-inverse" : "border-border-default text-text-primary"}`}>
              <input type="radio" name="trip_type" value={t} checked={form.trip_type === t} onChange={() => onChange("trip_type", t)} className="sr-only" />
              {t === "round_trip" ? "Round-trip" : "One-way"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <AirportCombobox id="origin" label="From" required value={form.origin} options={origins} error={errors.origin} onChange={(code) => onChange("origin", code)} />
        <AirportCombobox id="destination" label="To" required value={form.destination} options={destinations} error={errors.destination} onChange={(code) => onChange("destination", code)} />
        <div className="md:col-span-2 flex justify-end">
          {/* Routes run both ways, so swapping always gives a valid pair. type="button" keeps it from submitting the form. */}
          <Button type="button" variant="ghost" size="sm" onClick={onSwap}>
            Swap airports
          </Button>
        </div>
        <DateField id="depart_date" label="Departure date" required min={minDate} max={maxDate} value={form.depart_date} error={errors.depart_date} help="Available within the next 30 days." onChange={(e) => onChange("depart_date", e.target.value)} />
        {roundTrip && (
          <DateField id="return_date" label="Return date" required min={minDate} max={maxDate} value={form.return_date ?? ""} error={errors.return_date} onChange={(e) => onChange("return_date", e.target.value)} />
        )}
        <PassengerSelector value={Number(form.passengers)} error={errors.passengers} onChange={(n) => onChange("passengers", n)} />
      </div>

      {/* Disabled until airports and routes load, so validation never runs against an empty list. */}
      <Button type="submit" loading={submitting} disabled={!ready} className="w-full md:w-auto">
        {ready ? "Show flights" : "Loading airports…"}
      </Button>
    </form>
  );
}
