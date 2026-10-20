"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { IssueBanner } from "@/components/ui/IssueBanner";
import { SelectField, TextField } from "@/components/ui/Field";
import { api, type ApiIssue } from "@/lib/api/client";
import { useSession } from "@/lib/hooks/useSession";
import type { Passenger } from "@/lib/session/types";
import { type Errors, hasErrors, validatePassengers } from "@/lib/validation/rules";
import { Heading } from "@/components/ui/Heading";

const blankPassenger = (): Passenger => ({
  first_name: "", last_name: "", date_of_birth: "", gender: "", special_assistance: "NONE",
  email: "", phone: "", terms_accepted: false,
});

const GENDER_OPTIONS = [
  { value: "", label: "Select" },
  { value: "F", label: "Female" },
  { value: "M", label: "Male" },
  { value: "X", label: "Another gender" },
  { value: "U", label: "Prefer not to say" },
];

const ASSISTANCE_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "WHEELCHAIR", label: "Wheelchair assistance" },
  { value: "VISUAL", label: "Visual assistance" },
  { value: "HEARING", label: "Hearing assistance" },
];

export default function PassengersPage() {
  const router = useRouter();
  const { session, ready, save } = useSession();
  const count = session.search?.passengers ?? 0;
  // Edits live in `draft`. Until the traveler edits, saved details (or blanks) show.
  const [draft, setDraft] = useState<Passenger[] | null>(null);
  const [errors, setErrors] = useState<Errors[]>([]);
  const [issue, setIssue] = useState<ApiIssue>(null);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);

  // Keep saved details only when they match the party size.
  const saved = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ ...blankPassenger(), ...(session.passengers.length === count ? session.passengers[i] : {}) })),
    [count, session.passengers],
  );
  const people = draft ?? saved;

  useEffect(() => {
    if (ready && (!session.search || !session.outbound)) router.replace("/book/search");
  }, [ready, session.search, session.outbound, router]);

  const update = (index: number, field: keyof Passenger, value: string | boolean) => {
    setDraft(people.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSubmit();
  }

  async function runSubmit() {
    setIssue(null);
    const clientErrors = validatePassengers(people, todayUtc());
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) {
      setSummary(listErrors(clientErrors));
      return;
    }
    setSummary([]);

    setSubmitting(true);
    const result = await api("/bookings/validate-passengers", {
      method: "POST",
      body: { passenger_count: count, passengers: people },
      autoRetry: 2,
    });

    if (!result.ok) {
      const merged = mapServerErrors(result.fieldErrors, count);
      setErrors(merged);
      setSummary(listErrors(merged));
      setIssue(result.issue);
      setSubmitting(false);
      return;
    }

    const ok = await save({ passengers: people });
    setSubmitting(false);
    if (ok) router.push("/book/seats");
  }

  if (!session.search) return null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Passenger details</Heading>
      <p className="mt-2 text-text-muted">
        Enter details exactly as they appear on your ID. Passenger 1 is the primary contact for confirmations.
      </p>

      <div className="mt-6 space-y-4">
        <IssueBanner issue={issue} onRetry={runSubmit} retrying={submitting} />
        {summary.length > 0 && (
          <Alert tone="error" title="Please fix the following">
            <ul className="list-disc space-y-1 pl-5">
              {summary.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </Alert>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-10">
        {people.map((p, i) => {
          const e = errors[i] ?? {};
          const prefix = `p${i}`;
          return (
            <fieldset key={i} className="space-y-5 rounded-lg border border-border-subtle p-5">
              <legend className="px-2 text-lg font-semibold text-text-primary">
                Passenger {i + 1}{i === 0 ? " (primary contact)" : ""}
              </legend>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <TextField id={`${prefix}-first`} label="First name" required autoComplete="given-name" value={p.first_name} error={e.first_name} onChange={(ev) => update(i, "first_name", ev.target.value)} />
                <TextField id={`${prefix}-last`} label="Last name" required autoComplete="family-name" value={p.last_name} error={e.last_name} onChange={(ev) => update(i, "last_name", ev.target.value)} />
                <TextField id={`${prefix}-dob`} label="Date of birth" required type="date" value={p.date_of_birth} error={e.date_of_birth} onChange={(ev) => update(i, "date_of_birth", ev.target.value)} />
                <SelectField id={`${prefix}-gender`} label="Gender" error={e.gender} value={p.gender} onChange={(ev) => update(i, "gender", ev.target.value)}>
                  {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectField>
                <SelectField id={`${prefix}-assist`} label="Special assistance" error={e.special_assistance} value={p.special_assistance} onChange={(ev) => update(i, "special_assistance", ev.target.value)}>
                  {ASSISTANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SelectField>
              </div>

              {i === 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <TextField id={`${prefix}-email`} label="Email" required type="email" autoComplete="email" value={p.email} error={e.email} help="Confirmation details are sent here (simulated)." onChange={(ev) => update(i, "email", ev.target.value)} />
                  <TextField id={`${prefix}-phone`} label="Phone" type="tel" autoComplete="tel" value={p.phone} error={e.phone} help="Optional." onChange={(ev) => update(i, "phone", ev.target.value)} />
                  <div className="md:col-span-2">
                    <Checkbox
                      checked={p.terms_accepted}
                      onChange={(ev) => update(i, "terms_accepted", ev.target.checked)}
                      error={e.terms_accepted}
                    >
                      I agree to the Urban Air conditions of carriage. <span className="text-text-error" aria-hidden="true">*</span>
                    </Checkbox>
                  </div>
                </div>
              )}
            </fieldset>
          );
        })}

        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-between">
          <Link href="/book/flights" className="inline-flex min-h-control-md items-center justify-center rounded-md px-5 font-semibold text-text-link hover:bg-surface-brand">
            Back to flights
          </Link>
          <Button type="submit" loading={submitting}>Continue to seats</Button>
        </div>
      </form>
    </main>
  );
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Plain-language summary for the error list. Each message points at a field. */
function listErrors(errors: Errors[]): string[] {
  return errors.flatMap((e, i) => Object.values(e).map((msg) => `Passenger ${i + 1}: ${msg}`));
}

/** Maps server keys like "passengers.1.first_name" back to per-passenger error maps. */
function mapServerErrors(fieldErrors: Record<string, string>, count: number): Errors[] {
  const out: Errors[] = Array.from({ length: count }, () => ({}));
  for (const [key, message] of Object.entries(fieldErrors)) {
    const match = key.match(/^passengers\.(\d+)\.(.+)$/);
    if (match && Number(match[1]) < count) out[Number(match[1])][match[2]] = message;
  }
  return out;
}
