import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { formatTime, shortDate } from "@/lib/format";

export type BoardingLeg = {
  flight_number: string;
  flight_date: string;
  origin: string;
  destination: string;
  depart_time: string;
  arrive_time: string;
  class_label: string;
};

/**
 * Summary of one leg for the confirmation page. Every value has a visible label, so the layout
 * reads the same on a phone and a desktop. Status is a word, not only a color.
 */
export function BoardingPass({
  direction,
  leg,
  seats,
  passengers,
}: {
  direction: "Outbound" | "Return";
  leg: BoardingLeg;
  seats: string[];
  passengers: string[];
}) {
  const headingId = `leg-${direction.toLowerCase()}-${leg.flight_number}`;
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={3} size={4} id={headingId}>
          {leg.origin} → {leg.destination}
        </Heading>
        <div className="flex items-center gap-2">
          <Badge tone="success">Confirmed</Badge>
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{direction}</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4" aria-labelledby={headingId}>
        <div>
          <dt className="text-text-muted">Flight</dt>
          <dd className="font-semibold text-text-primary">{leg.flight_number}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Date</dt>
          <dd className="font-semibold text-text-primary">{shortDate(leg.flight_date)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Departs</dt>
          <dd className="font-semibold text-text-primary">{formatTime(leg.depart_time)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Arrives</dt>
          <dd className="font-semibold text-text-primary">{formatTime(leg.arrive_time)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Class</dt>
          <dd className="font-semibold text-text-primary">{leg.class_label}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-text-muted">Seats</dt>
          <dd className="font-semibold text-text-primary">{seats.join(", ")}</dd>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-text-muted">Passengers</dt>
          <dd className="font-semibold text-text-primary">{passengers.join(", ")}</dd>
        </div>
      </dl>
    </Card>
  );
}
