"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FlightCard, type FlightOption } from "@/components/booking/FlightCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { IssueBanner } from "@/components/ui/IssueBanner";
import { SortBar, type SortState } from "@/components/ui/SortBar";
import { api, type ApiIssue } from "@/lib/api/client";
import { useSession } from "@/lib/hooks/useSession";
import { sortItems } from "@/lib/sort";
import type { Leg } from "@/lib/session/types";
import { Heading } from "@/components/ui/Heading";

type Choice = { flightId: number; classCode: string } | null;

const SORT_KEYS = [
  { key: "depart", label: "Departure time" },
  { key: "arrive", label: "Arrival time" },
  { key: "duration", label: "Duration" },
  { key: "price", label: "Lowest price" },
  { key: "seats", label: "Seats left" },
];

const ACCESSORS = {
  depart: (f: FlightOption) => f.depart_time,
  arrive: (f: FlightOption) => f.arrive_time,
  duration: (f: FlightOption) => f.duration_min,
  price: (f: FlightOption) => Math.min(...f.classes.filter((c) => c.available).map((c) => c.price_cents), Infinity),
  seats: (f: FlightOption) => f.classes.reduce((sum, c) => sum + c.seats_open, 0),
};

export default function FlightsPage() {
  const router = useRouter();
  const { session, ready, save } = useSession();
  const search = session.search;

  // Results are keyed by the request that produced them, so loading is derived, not stored.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${JSON.stringify(search)}#${attempt}`;
  const [result, setResult] = useState<{ key: string; legs: { outbound: FlightOption[]; return: FlightOption[] }; issue: ApiIssue } | null>(null);
  const loading = search !== null && result?.key !== requestKey;
  const legs = result?.key === requestKey ? result.legs : null;
  const issue = result?.key === requestKey ? result.issue : null;

  // Issues from continuing (fare checks) are separate from search load issues.
  const [flowIssue, setFlowIssue] = useState<ApiIssue>(null);
  const [fareNotice, setFareNotice] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "depart", dir: "asc" });
  // Local picks override the saved session. Until the traveler picks, the saved leg shows.
  const [outPick, setOutPick] = useState<Choice | undefined>(undefined);
  const [retPick, setRetPick] = useState<Choice | undefined>(undefined);
  const outChoice: Choice = outPick !== undefined ? outPick : session.outbound ? { flightId: session.outbound.flight_id, classCode: session.outbound.class } : null;
  const retChoice: Choice = retPick !== undefined ? retPick : session.return ? { flightId: session.return.flight_id, classCode: session.return.class } : null;
  const [active, setActive] = useState<"outbound" | "return">("outbound");

  useEffect(() => {
    if (ready && !search) router.replace("/book/search");
  }, [ready, search, router]);

  useEffect(() => {
    if (!search) return;
    let cancelled = false;
    const key = requestKey;
    api<{ outbound: FlightOption[]; return: FlightOption[] | null }>("/search", { method: "POST", body: search, autoRetry: 2 }).then((res) => {
      if (cancelled) return;
      const failure: ApiIssue = {
        code: "search", title: "We could not load flights", message: res.errors[0]?.message ?? "Please try again.",
        retry_allowed: true, blocking: true,
      };
      setResult({
        key,
        legs: { outbound: res.data?.outbound ?? [], return: res.data?.return ?? [] },
        issue: res.issue ?? (res.ok ? null : failure),
      });
    });
    return () => {
      cancelled = true;
    };
    // requestKey already captures search and attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const roundTrip = search?.trip_type === "round_trip";
  const passengers = search?.passengers ?? 1;
  const list = useMemo(() => (legs ? (active === "outbound" ? legs.outbound : legs.return) : []), [legs, active]);
  const visible = useMemo(() => sortItems(list, sort, ACCESSORS), [list, sort]);
  const outDone = outChoice !== null;
  const retDone = !roundTrip || retChoice !== null;

  function choose(leg: "outbound" | "return", flightId: number, classCode: string) {
    setFareNotice(false);
    if (leg === "outbound") setOutPick({ flightId, classCode });
    else setRetPick({ flightId, classCode });
  }

  /** Re-checks the fare for each chosen leg. A changed fare is shown first, then the traveler continues. */
  async function continueToPassengers() {
    if (!legs || !search || !outChoice || !retDone) return;
    setContinuing(true);
    setFlowIssue(null);

    const refreshed: Leg[] = [];
    let changed = false;
    for (const [leg, choice, direction] of [["outbound", outChoice, legs.outbound], ["return", retChoice, legs.return]] as const) {
      if (leg === "return" && !roundTrip) continue;
      const flight = direction.find((f) => f.id === choice?.flightId);
      const cls = flight?.classes.find((c) => c.code === choice?.classCode);
      if (!flight || !cls) continue;

      const detail = await api<{ flight: FlightOption & { classes: FlightOption["classes"] } }>(`/flights/${flight.id}`, { autoRetry: 2 });
      if (!detail.ok && detail.issue?.blocking) {
        setFlowIssue(detail.issue);
        setContinuing(false);
        return;
      }
      const freshClass = detail.data?.flight.classes.find((c) => c.code === cls.code) ?? cls;
      if (detail.issue && detail.issue.code === "fare_changed") {
        changed = true;
        setFlowIssue(detail.issue);
        // Refresh the displayed prices so the traveler sees the new fare.
        if (leg === "outbound" && detail.data) {
          const updated = detail.data.flight.classes;
          setResult((prev) => prev && {
            ...prev,
            legs: { ...prev.legs, outbound: prev.legs.outbound.map((f) => (f.id === flight.id ? { ...f, classes: updated } : f)) },
          });
        }
      }

      refreshed.push({
        flight_id: flight.id,
        flight_number: flight.flight_number,
        class: cls.code,
        class_label: cls.label,
        price_cents: freshClass.price_cents,
        origin: flight.route.origin,
        destination: flight.route.destination,
        flight_date: flight.flight_date,
        depart_time: flight.depart_time,
        arrive_time: flight.arrive_time,
      });
    }

    if (changed && !fareNotice) {
      setFareNotice(true);
      setContinuing(false);
      return;
    }

    const [outbound, ret] = refreshed;
    const sameChoice = session.outbound?.flight_id === outbound?.flight_id && session.outbound?.class === outbound?.class
      && session.return?.flight_id === ret?.flight_id && session.return?.class === ret?.class;
    const ok = await save({
      outbound: outbound ?? null,
      return: roundTrip ? ret ?? null : null,
      seats: sameChoice ? session.seats : { outbound: [], return: [] },
    });
    setContinuing(false);
    if (ok) router.push("/book/passengers");
  }

  if (!search) return null;

  const outboundRoute = `${search.origin} → ${search.destination}`;
  const returnRoute = `${search.destination} → ${search.origin}`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Choose your flights</Heading>
      <p className="mt-2 text-text-muted">
        {search.passengers} {search.passengers === 1 ? "passenger" : "passengers"} · {roundTrip ? "Round-trip" : "One-way"} · Showing all available flights.
      </p>

      {roundTrip && (
        <div role="tablist" aria-label="Trip leg" className="mt-6 grid grid-cols-2 gap-2 rounded-md bg-surface-brand p-1">
          {(["outbound", "return"] as const).map((leg) => (
            <button
              key={leg}
              role="tab"
              type="button"
              aria-selected={active === leg}
              onClick={() => setActive(leg)}
              className={`min-h-control-md rounded-md px-3 py-2 text-sm font-semibold ${active === leg ? "bg-surface-canvas text-text-primary shadow-card" : "text-text-muted"}`}
            >
              {leg === "outbound" ? `Outbound · ${outboundRoute}` : `Return · ${returnRoute}`}
              {(leg === "outbound" ? outDone : retDone) && <span className="ml-2 text-text-accent" aria-label="selected">✓</span>}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <IssueBanner issue={flowIssue ?? issue} onRetry={() => setAttempt((n) => n + 1)} retrying={loading} />
        {fareNotice && (
          <Alert tone="warning" title="Your fare was updated">
            The price for one of your flights changed. Review the new price, then continue.
          </Alert>
        )}
        <SortBar keys={SORT_KEYS} value={sort} onChange={setSort} />
      </div>

      {loading ? (
        <p role="status" className="mt-8 text-text-muted">Finding flights…</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {visible.map((flight) => {
            const choice = active === "outbound" ? outChoice : retChoice;
            const isSelected = choice?.flightId === flight.id;
            return (
              <li key={flight.id}>
                <FlightCard
                  flight={flight}
                  passengers={passengers}
                  selected={isSelected}
                  selectedClass={isSelected ? choice!.classCode : null}
                  onClassChange={(code) => choose(active, flight.id, code)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className="sticky bottom-0 mt-10 flex flex-col gap-3 border-t border-border-subtle bg-surface-canvas/95 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-primary">
          {outDone ? "Outbound selected." : "Choose an outbound flight."} {roundTrip && (retDone ? "Return selected." : "Choose a return flight.")}
        </p>
        <div className="flex gap-3">
          {roundTrip && active === "outbound" && outDone && (
            <Button variant="secondary" onClick={() => setActive("return")}>Choose return</Button>
          )}
          <Button onClick={continueToPassengers} disabled={!outDone || !retDone} loading={continuing}>
            Continue to passengers
          </Button>
        </div>
      </div>
    </main>
  );
}
