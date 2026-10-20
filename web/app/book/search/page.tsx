"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { FlightSearchPanel } from "@/components/booking/FlightSearchPanel";
import { Heading } from "@/components/ui/Heading";
import { IssueBanner } from "@/components/ui/IssueBanner";
import { api, type ApiIssue } from "@/lib/api/client";
import { emptySession } from "@/lib/session/defaults";
import type { Search } from "@/lib/session/types";
import { useSession } from "@/lib/hooks/useSession";
import { addDays, type Errors, validateSearch } from "@/lib/validation/rules";

type Airport = { code: string; name: string; city: string };
type Route = { origin: string; destination: string };

const todayUtc = () => new Date().toISOString().slice(0, 10);

export default function SearchPage() {
  const router = useRouter();
  const { session, save } = useSession();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  // Edits live in `draft`. Until the traveler changes something, the saved search (or defaults) shows.
  const [draft, setDraft] = useState<Search | null>(null);
  const [defaults] = useState<Search>(() => ({
    origin: "DFW", destination: "LAX", trip_type: "round_trip",
    depart_date: addDays(todayUtc(), 3), return_date: addDays(todayUtc(), 6), passengers: 1,
  }));
  const form: Search = draft ?? session.search ?? defaults;
  const [errors, setErrors] = useState<Errors>({});
  const [issue, setIssue] = useState<ApiIssue>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<{ airports: Airport[] }>("/airports", { autoRetry: 2 }), api<{ routes: Route[] }>("/routes", { autoRetry: 2 })]).then(([a, r]) => {
      if (a.ok && a.data) setAirports(a.data.airports);
      if (r.ok && r.data) setRoutes(r.data.routes);
      if (!a.ok || !r.ok) setLoadError("Airports are loading slowly. Refresh the page if the lists stay empty.");
    });
  }, []);

  // Destinations are limited to airports that pair with the chosen origin.
  const ready = airports.length > 0 && routes.length > 0;

  const destinations = useMemo(() => {
    const codes = new Set<string>();
    for (const r of routes) {
      if (r.origin === form.origin) codes.add(r.destination);
      if (r.destination === form.origin) codes.add(r.origin);
    }
    return airports.filter((a) => codes.has(a.code));
  }, [routes, airports, form.origin]);

  const origins = useMemo(() => {
    const codes = new Set(routes.flatMap((r) => [r.origin, r.destination]));
    return airports.filter((a) => codes.has(a.code));
  }, [routes, airports]);

  const update = <K extends keyof Search>(key: K, value: Search[K]) => {
    setDraft(() => {
      const next = { ...form, [key]: value };
      if (key === "origin" && !routes.some((r) => (r.origin === value && r.destination === next.destination) || (r.destination === value && r.origin === next.destination))) {
        const first = routes.find((r) => r.origin === value || r.destination === value);
        if (first) next.destination = first.origin === value ? first.destination : first.origin;
      }
      return next;
    });
  };

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setIssue(null);
    const clientErrors = validateSearch({ ...form, passengers: Number(form.passengers) }, todayUtc(), airports.map((a) => a.code));
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    const body = { ...form, passengers: Number(form.passengers), return_date: form.trip_type === "round_trip" ? form.return_date : null };
    const result = await api("/search", { method: "POST", body, autoRetry: 2 });
    if (!result.ok) {
      setErrors(result.fieldErrors);
      setIssue(result.issue);
      setSubmitting(false);
      return;
    }

    const saved = await save({ ...emptySession(), search: body });
    setSubmitting(false);
    if (saved) router.push("/book/flights");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Find your flight</Heading>
      <p className="mt-2 text-text-muted">Choose your route, dates, and passengers. We will show every flight we have for your search.</p>

      {loadError && <p role="status" className="mt-4 text-sm text-text-primary">{loadError}</p>}
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="mt-6 rounded-md border-l-4 border-solid-error bg-surface-error p-4 text-sm">
          <p className="font-semibold">Please fix the highlighted fields.</p>
        </div>
      )}
      <div className="mt-4"><IssueBanner issue={issue} onRetry={() => submit()} retrying={submitting} /></div>

      <FlightSearchPanel
        form={form}
        errors={errors}
        origins={origins}
        destinations={destinations}
        ready={ready}
        submitting={submitting}
        minDate={addDays(todayUtc(), 1)}
        maxDate={addDays(todayUtc(), 30)}
        onChange={update}
        onSwap={() => setDraft({ ...form, origin: form.destination, destination: form.origin })}
        onSubmit={submit}
      />
    </main>
  );
}
