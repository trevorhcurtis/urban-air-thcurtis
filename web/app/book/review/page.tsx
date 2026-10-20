"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { IssueBanner } from "@/components/ui/IssueBanner";
import { useStepIssue } from "@/components/booking/StepIssues";
import { api, type ApiIssue } from "@/lib/api/client";
import { breakdown } from "@/lib/pricing";
import { formatTime, money, shortDate } from "@/lib/format";
import { useSession } from "@/lib/hooks/useSession";
import type { Leg, Trip } from "@/lib/session/types";
import { type Errors, hasErrors, type PaymentInput, validatePayment } from "@/lib/validation/rules";
import { Heading } from "@/components/ui/Heading";

const EMPTY_PAYMENT: PaymentInput = { cardholder_name: "", card_number: "", expiry: "", cvv: "", postal_code: "" };

export default function ReviewPage() {
  const router = useRouter();
  const { session, ready, reset } = useSession();
  const count = session.search?.passengers ?? 0;
  const [payment, setPayment] = useState<PaymentInput>(EMPTY_PAYMENT);
  const [errors, setErrors] = useState<Errors>({});
  const [issue, setIssue] = useState<ApiIssue>(null);
  useStepIssue(4, issue?.blocking ? issue.title : null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Set once the trip is confirmed, so clearing the session does not trigger the booking guard.
  const completed = useRef(false);

  const legs = useMemo<Leg[]>(() => [session.outbound, session.return].filter((l): l is Leg => l !== null), [session.outbound, session.return]);
  const price = useMemo(() => breakdown(legs, count), [legs, count]);

  useEffect(() => {
    if (!ready || completed.current) return;
    const seatsReady = session.seats.outbound.length === count && (!session.return || session.seats.return.length === count);
    if (!session.search || legs.length === 0 || session.passengers.length !== count || !seatsReady) {
      router.replace("/book/search");
    }
  }, [ready, session, legs.length, count, router]);

  const setField = (field: keyof PaymentInput, value: string) => setPayment((p) => ({ ...p, [field]: value }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runPurchase();
  }

  async function runPurchase() {
    setIssue(null);
    const clientErrors = validatePayment(payment, new Date().toISOString().slice(0, 10));
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    setStatus("Checking your card details…");

    const cardCheck = await api("/bookings/validate-payment", { method: "POST", body: payment, autoRetry: 2 });
    if (!cardCheck.ok) {
      setErrors(cardCheck.fieldErrors);
      setIssue(cardCheck.issue);
      setStatus(null);
      setSubmitting(false);
      return;
    }

    setStatus("Confirming your trip…");
    const outbound = session.outbound!;
    const confirm = await api<{ confirmation_code: string }>("/bookings/confirm", {
      method: "POST",
      body: {
        outbound: { flight_id: outbound.flight_id, class: outbound.class },
        return: session.return ? { flight_id: session.return.flight_id, class: session.return.class } : null,
        passengers: session.passengers,
      },
    });
    if (!confirm.ok || !confirm.data) {
      setIssue(confirm.issue ?? {
        code: "confirm", title: "We could not confirm your trip", message: confirm.errors[0]?.message ?? "Please try again.",
        retry_allowed: true, blocking: true,
      });
      setStatus(null);
      setSubmitting(false);
      return;
    }

    const trip: Trip = {
      confirmation_code: confirm.data.confirmation_code,
      created_at: new Date().toISOString(),
      search: session.search!,
      legs,
      passengers: session.passengers.map((p) => ({ first_name: p.first_name, last_name: p.last_name })),
      seats: session.seats,
      base_fare_cents: price.base,
      taxes_cents: price.taxes,
      fees_cents: price.fees,
      total_cents: price.total,
    };

    const saved = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(trip) });
    if (!saved.ok) {
      setIssue({ code: "trip_storage", title: "Trip saved for this visit only", message: "We confirmed your trip but could not store it in your browser. Note your confirmation code.", retry_allowed: false, blocking: false });
    }

    // Drop card details from memory and clear the booking. Trip details remain in the trips cookie.
    completed.current = true;
    setPayment(EMPTY_PAYMENT);
    await reset();
    router.push(`/book/confirmation?code=${encodeURIComponent(trip.confirmation_code)}`);
  }

  if (!session.search || legs.length === 0 || completed.current) return null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Heading level={1} size={2}>Review and pay</Heading>
      <p className="mt-2 text-text-muted">Check your trip, then enter payment details.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-split">
        <section aria-labelledby="itinerary-heading" className="space-y-6">
          <h2 id="itinerary-heading" className="sr-only">Your trip</h2>

          {legs.map((leg, i) => (
            <article key={`${leg.flight_id}-${i}`} className="rounded-lg border border-border-subtle p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">{i === 0 ? "Outbound" : "Return"}</p>
                <Link href="/book/flights" className="text-sm font-semibold text-text-link underline-offset-4 hover:underline">Change flight</Link>
              </div>
              <p className="mt-2 text-lg font-semibold text-text-primary">{leg.flight_number} · {shortDate(leg.flight_date)}</p>
              <p className="text-sm text-text-primary">
                {leg.origin} {formatTime(leg.depart_time)} → {leg.destination} {formatTime(leg.arrive_time)} · {leg.class_label}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Seats: {(i === 0 ? session.seats.outbound : session.seats.return).join(", ")}
              </p>
            </article>
          ))}

          <article className="rounded-lg border border-border-subtle p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary">Passengers</p>
              <Link href="/book/passengers" className="text-sm font-semibold text-text-link underline-offset-4 hover:underline">Edit</Link>
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm text-text-primary">
              {session.passengers.map((p, i) => <li key={i}>{p.first_name} {p.last_name}</li>)}
            </ul>
          </article>

          <article className="rounded-lg border border-border-subtle p-5">
            <p className="font-semibold text-text-primary">Price</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Base fare ({count} × {legs.length} {legs.length === 1 ? "leg" : "legs"})</dt><dd>{money(price.base)}</dd></div>
              <div className="flex justify-between"><dt>Taxes (7.5%)</dt><dd>{money(price.taxes)}</dd></div>
              <div className="flex justify-between"><dt>Carrier fees</dt><dd>{money(price.fees)}</dd></div>
              <div className="flex justify-between border-t border-border-subtle pt-2 text-md font-bold"><dt>Total</dt><dd>{money(price.total)}</dd></div>
            </dl>
          </article>
        </section>

        <section aria-labelledby="payment-heading" className="space-y-5">
          <h2 id="payment-heading" className="text-h4 font-semibold text-text-primary">Payment</h2>
          <Alert tone="info" title="This is a prototype">
            No payment is processed, verified, or stored. Use any test values in the correct format.
          </Alert>

          <IssueBanner issue={issue} onRetry={runPurchase} retrying={submitting} />
          {status && <p role="status" className="text-sm text-text-muted">{status}</p>}

          <form onSubmit={onSubmit} noValidate className="space-y-4" autoComplete="off">
            <TextField id="cardholder" label="Name on card" required autoComplete="cc-name" value={payment.cardholder_name} error={errors.cardholder_name} onChange={(e) => setField("cardholder_name", e.target.value)} />
            <TextField id="card-number" label="Card number" required inputMode="numeric" autoComplete="off" placeholder="4111 1111 1111 1111" value={payment.card_number} error={errors.card_number} help="Format check only. Nothing is stored." onChange={(e) => setField("card_number", e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <TextField id="expiry" label="Expiry (MM/YY)" required inputMode="numeric" autoComplete="off" placeholder="12/30" value={payment.expiry} error={errors.expiry} onChange={(e) => setField("expiry", e.target.value)} />
              <TextField id="cvv" label="Security code" required inputMode="numeric" autoComplete="off" value={payment.cvv} error={errors.cvv} onChange={(e) => setField("cvv", e.target.value)} />
            </div>
            <TextField id="postal" label="Billing ZIP code" required inputMode="numeric" autoComplete="postal-code" value={payment.postal_code} error={errors.postal_code} onChange={(e) => setField("postal_code", e.target.value)} />

            <Button type="submit" className="w-full" loading={submitting}>
              Pay {money(price.total)} and confirm
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
