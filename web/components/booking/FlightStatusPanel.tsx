import { Badge } from "@/components/ui/Badge";
import { FLIGHT_STATUS, type FlightStatusCode } from "@/lib/flightStatus";

export type LegStatus = {
  flight_number: string;
  /** Undefined while loading. Null when the status could not be loaded. */
  status: FlightStatusCode | null | undefined;
};

/**
 * Status for each leg of a trip. The word is always shown, so the badge colour is never the only signal.
 */
export function FlightStatusPanel({ legs }: { legs: LegStatus[] }) {
  return (
    <ul aria-label="Flight status" className="mt-3 space-y-1 text-sm text-text-primary">
      {legs.map((leg) => (
        <li key={leg.flight_number} className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{leg.flight_number}</span>
          {leg.status === undefined && <span className="text-text-muted">Checking status…</span>}
          {leg.status === null && <span className="text-text-muted">Status unavailable</span>}
          {leg.status && <Badge tone={FLIGHT_STATUS[leg.status].tone}>{FLIGHT_STATUS[leg.status].label}</Badge>}
        </li>
      ))}
    </ul>
  );
}
