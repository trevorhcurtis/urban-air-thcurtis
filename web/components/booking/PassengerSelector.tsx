"use client";

import { Button } from "@/components/ui/Button";
import { useId } from "react";

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 9;

const PASSENGER_COUNTS = Array.from({ length: MAX_PASSENGERS - MIN_PASSENGERS + 1 }, (_, i) => MIN_PASSENGERS + i);

/**
 * Stepper for the passenger count. The middle control is a dropdown of 1 to 9, and the buttons step
 * it and stop at the limits. The buttons are type="button" so pressing them never submits the form.
 */
export function PassengerSelector({ value, onChange, error }: { value: number; onChange: (next: number) => void; error?: string }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col">
      <span id={labelId} className="text-sm font-medium text-text-primary">
        Passengers
      </span>
      <div className="mt-1 flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          aria-label="Fewer passengers"
          disabled={value <= MIN_PASSENGERS}
          onClick={() => onChange(Math.max(MIN_PASSENGERS, value - 1))}
        >
          −
        </Button>
        <select
          aria-label="Number of passengers"
          aria-invalid={error ? true : undefined}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`min-h-control-md min-w-20 rounded-md border bg-surface-canvas px-3 text-center text-lg font-semibold text-text-primary ${error ? "border-solid-error" : "border-border-default"}`}
        >
          {PASSENGER_COUNTS.map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "passenger" : "passengers"}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="md"
          aria-label="More passengers"
          disabled={value >= MAX_PASSENGERS}
          onClick={() => onChange(Math.min(MAX_PASSENGERS, value + 1))}
        >
          +
        </Button>
      </div>
      {error && <p className="mt-1 text-sm font-medium text-text-error">{error}</p>}
    </div>
  );
}
