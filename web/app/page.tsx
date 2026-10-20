import Image from "next/image";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { apiGet } from "@/lib/api/server";
import { Heading } from "@/components/ui/Heading";

type Route = { origin: string; destination: string; duration_min: number };
type Airport = { code: string; city: string };

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-surface-inverse text-text-inverse">
        <Image
          src="/images/hero-cabin.jpg"
          alt="Rows of seats in an Urban Air cabin with the aisle running to the front"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-40"
        />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-text-inverse">Urban Air</p>
          <Heading level={1} brand className="max-w-2xl text-text-inverse md:text-display">Fly Further Together.</Heading>
          <p className="max-w-xl text-lg text-text-inverse">
            Round-trip and one-way flights across six routes. Choose your seats, manage your trips, and earn rewards as you go.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/book/search" className="!bg-surface-canvas !text-text-primary hover:!bg-surface-brand">Start a booking</ButtonLink>
            <ButtonLink href="/rewards" variant="secondary" className="!border-surface-canvas !bg-transparent !text-text-inverse hover:!bg-surface-canvas/10">Explore rewards</ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <Heading level={2} size={3}>Routes we fly</Heading>
        <p className="mt-2 text-text-muted">Each route works in both directions.</p>
        <Suspense fallback={<p role="status" className="mt-6 text-text-muted">Loading routes…</p>}>
          <RouteList />
        </Suspense>
      </section>
    </>
  );
}

async function RouteList() {
  const [routes, airports] = await Promise.all([
    apiGet<{ routes: Route[] }>("/routes"),
    apiGet<{ airports: Airport[] }>("/airports"),
  ]);
  const cityOf = new Map((airports?.airports ?? []).map((a) => [a.code, a.city]));

  if (routes === null) {
    return <p role="status" className="mt-6 text-sm text-text-muted">Route information is unavailable right now. You can still start a booking.</p>;
  }

  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {routes.routes.map((route) => (
        <li key={`${route.origin}-${route.destination}`}>
          <div className="flex h-full flex-col gap-2 rounded-lg border border-border-subtle bg-surface-canvas p-5 shadow-card">
            <p className="text-lg font-semibold text-text-primary">
              {route.origin} <span aria-hidden="true">↔</span> {route.destination}
            </p>
            <p className="text-sm text-text-muted">
              {cityOf.get(route.origin) ?? route.origin} to {cityOf.get(route.destination) ?? route.destination}
            </p>
            <p className="mt-auto text-sm text-text-primary">About {Math.floor(route.duration_min / 60)}h {route.duration_min % 60}m in the air</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
