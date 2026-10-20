"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type FeatureMap, type SeatData, SeatMap, type SeatLayout } from "@/components/booking/SeatMap";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { IssueBanner } from "@/components/ui/IssueBanner";
import { useStepIssue } from "@/components/booking/StepIssues";
import { api, type ApiIssue } from "@/lib/api/client";
import { useSession } from "@/lib/hooks/useSession";
import type { Leg } from "@/lib/session/types";
import { shortDate } from "@/lib/format";
import { Heading } from "@/components/ui/Heading";

type SeatResponse = {
  layout: SeatLayout;
  seats: SeatData[];
  features: FeatureMap;
};

type LegKey = "outbound" | "return";

export default function SeatsPage() {
  const router = useRouter();
  const { session, ready, save } = useSession();
  const count = session.search?.passengers ?? 0;
  const legs: { key: LegKey; leg: Leg }[] = [
    ...(session.outbound ? [{ key: "outbound" as const, leg: session.outbound }] : []),
    ...(session.return ? [{ key: "return" as const, leg: session.return }] : []),
  ];

  const [legIndex, setLegIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [picks, setPicks] = useState<Record<LegKey, string[]> | null>(null);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);

  // Picks start from the saved seats and only diverge once the traveler clicks a seat.
  const fromSession = useMemo(() => ({
    outbound: pad(session.seats.outbound, count),
    return: pad(session.seats.return, count),
  }), [session.seats, count]);
  const assignments = picks ?? fromSession;

  useEffect(() => {
    if (ready && (!session.search || !session.outbound || session.passengers.length !== count)) {
      router.replace(session.passengers.length !== count && session.outbound ? "/book/passengers" : "/book/search");
    }
  }, [ready, session.search, session.outbound, session.passengers, count, router]);

  const current = legs[legIndex];
  const seatKey = `${current?.leg.flight_id ?? "none"}#${attempt}`;
  const [seatResult, setSeatResult] = useState<{ key: string; data: SeatResponse | null; issue: ApiIssue } | null>(null);
  const loading = current !== undefined && seatResult?.key !== seatKey;
  const seatMap = seatResult?.key === seatKey ? seatResult.data : null;
  const issue = seatResult?.key === seatKey ? seatResult.issue : null;
  useStepIssue(3, issue?.blocking ? issue.title : null);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    const key = seatKey;
    api<SeatResponse>(`/flights/${current.leg.flight_id}/seatmap`, { autoRetry: 2 }).then((res) => {
      if (cancelled) return;
      setSeatResult({
        key,
        data: res.ok ? res.data : null,
        issue: res.ok ? res.issue : res.issue ?? {
          code: "seatmap", title: "Seat map unavailable", message: res.errors[0]?.message ?? "Please try again.",
          retry_allowed: true, blocking: true,
        },
      });
    });
    return () => {
      cancelled = true;
    };
    // seatKey already captures the leg and attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatKey]);

  const key = current?.key ?? "outbound";
  const seatsForLeg = assignments[key] ?? [];
  const passengerNames = useMemo(() => session.passengers.map((p) => `${p.first_name} ${p.last_name}`), [session.passengers]);

  if (!current) return null;

  const assignedAll = seatsForLeg.length === count && seatsForLeg.every(Boolean);

  function pick(code: string) {
    setPicks((prev) => {
      const base = prev ?? fromSession;
      const list = [...base[key]];
      const existing = list.indexOf(code);
      if (existing !== -1) {
        list[existing] = "";
        return withLeg(base, key, list);
      }
      list[active] = code;
      return withLeg(base, key, list);
    });
    const next = Array.from({ length: count }, (_, i) => i).find((i) => i > active && !assignments[key][i]);
    setActive(next ?? active);
  }

  /** Fills unassigned passengers with open seats in the fare class, front rows first. */
  function assignForMe() {
    if (!seatMap) return;
    const taken = new Set(seatsForLeg.filter(Boolean));
    const open = seatMap.seats
      .filter((s) => s.status === "open" && s.class === current!.leg.class && !taken.has(`${s.row}${s.col}`))
      .sort((a, b) => a.row - b.row || a.col.localeCompare(b.col))
      .map((s) => `${s.row}${s.col}`);
    setPicks((prev) => {
      const base = prev ?? fromSession;
      const list = [...base[key]];
      for (let i = 0; i < count; i++) {
        if (!list[i] && open.length) list[i] = open.shift()!;
      }
      return withLeg(base, key, list);
    });
  }

  async function continueOn() {
    if (!assignedAll) return;
    setSaving(true);
    const next = {
      outbound: key === "outbound" ? seatsForLeg : assignments.outbound,
      return: key === "return" ? seatsForLeg : assignments.return,
    };
    const ok = await save({ seats: next });
    setSaving(false);
    if (!ok) return;

    if (legIndex < legs.length - 1) {
      setLegIndex(legIndex + 1);
      setActive(0);
    } else {
      router.push("/book/review");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Choose your seats</Heading>
      <p className="mt-2 text-text-muted">
        {current.leg.flight_number} · {shortDate(current.leg.flight_date)} · {current.leg.class_label}
      </p>

      {legs.length > 1 && (
        <p className="mt-2 text-sm text-text-primary">Leg {legIndex + 1} of {legs.length}: {legIndex === 0 ? "outbound" : "return"}</p>
      )}

      <div className="mt-6 space-y-4">
        <IssueBanner issue={issue} onRetry={() => setAttempt((n) => n + 1)} retrying={loading} />
        {!loading && !seatMap && !issue && (
          <Alert tone="warning" title="Seat map unavailable">We could not load seats. Try again, or continue and we will assign seats for you.</Alert>
        )}
      </div>

      <section className="mt-6 space-y-3" aria-labelledby="passengers-heading">
        <h2 id="passengers-heading" className="text-sm font-semibold text-text-primary">Pick a seat for each passenger</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {passengerNames.map((name, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={active === i}
                onClick={() => setActive(i)}
                className={`flex w-full min-h-control-md items-center justify-between gap-3 rounded-md border px-4 py-2 text-left text-sm ${
                  active === i ? "border-border-interactive bg-surface-brand" : "border-border-default bg-surface-canvas"
                }`}
              >
                <span className="font-medium text-text-primary">{i + 1}. {name}</span>
                <span className="font-semibold text-text-link">{seatsForLeg[i] || "Not chosen"}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        {loading && <p role="status" className="text-text-muted">Loading seats…</p>}
        {seatMap && !loading && (
          <SeatMap
            layout={seatMap.layout}
            seats={seatMap.seats}
            features={seatMap.features}
            fareClass={current.leg.class}
            assigned={seatsForLeg}
            activePassenger={active}
            onPick={pick}
            nameFor={(i) => passengerNames[i]}
          />
        )}
      </div>

      <div className="sticky bottom-0 mt-10 flex flex-col gap-3 border-t border-border-subtle bg-surface-canvas/95 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <Button variant="secondary" onClick={assignForMe} disabled={!seatMap || assignedAll}>
          Assign seats for me
        </Button>
        <Button onClick={continueOn} disabled={!assignedAll} loading={saving}>
          {legIndex < legs.length - 1 ? "Continue to return seats" : "Review your trip"}
        </Button>
      </div>
    </main>
  );
}

function withLeg(base: Record<LegKey, string[]>, leg: LegKey, list: string[]): Record<LegKey, string[]> {
  return leg === "outbound" ? { outbound: list, return: base.return } : { outbound: base.outbound, return: list };
}

function pad(list: string[], length: number): string[] {
  return Array.from({ length }, (_, i) => list[i] ?? "");
}
