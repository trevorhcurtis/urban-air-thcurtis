import Image from "next/image";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { Disclosure } from "@/components/ui/Disclosure";
import { Heading } from "@/components/ui/Heading";

export const metadata = { title: "Rewards" };

type Tier = { code: string; name: string; min_points: number; benefits: string };

export default function RewardsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <Heading level={1} size={2} brand className="md:text-h1">Urban Air Rewards</Heading>
          <p className="text-lg text-text-muted">
            Earn points on every trip and move up tiers for more benefits. Points come from the base fare, not taxes or fees.
          </p>
        </div>
        <div className="relative aspect-photo overflow-hidden rounded-lg">
          <Image src="/images/sky-departure.jpg" alt="An airliner climbing away over clouds and mountains" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="tiers-heading">
        <h2 id="tiers-heading" className="text-h3 font-bold text-text-primary">Tiers</h2>
        <Suspense fallback={<p role="status" className="mt-4 text-text-muted">Loading tiers…</p>}>
          <Tiers />
        </Suspense>
      </section>

      <section className="mt-12 max-w-3xl space-y-3" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-h3 font-bold text-text-primary">Questions</h2>
        <Disclosure title="How do I earn points?">
          Book a flight and earn one point for every dollar of base fare on each leg. Partner purchases can add more.
        </Disclosure>
        <Disclosure title="Do points expire?">
          In this prototype, points reset when the sample data reseeds every 24 hours.
        </Disclosure>
        <Disclosure title="What is the starting bonus?">
          New visitors start with 2,500 points so the tiers are easy to see. It is not a real balance.
        </Disclosure>
        <p className="text-sm text-text-muted">Fares shown on the site are examples for this prototype.</p>
      </section>
    </main>
  );
}

async function Tiers() {
  const data = await apiGet<{ tiers: Tier[] }>("/rewards/tiers");
  const tiers = data?.tiers ?? [];

  if (tiers.length === 0) {
    return <p role="status" className="mt-4 text-text-muted">Tier details are unavailable right now. Please check back shortly.</p>;
  }

  return (
    <ol className="mt-6 grid gap-4 md:grid-cols-4">
      {tiers.map((tier) => (
        <li key={tier.code} className="flex flex-col gap-3 rounded-lg border border-border-subtle p-5">
          <p className="text-lg font-semibold text-text-primary">{tier.name}</p>
          <p className="text-sm text-text-muted">
            {tier.min_points === 0 ? "Starting tier" : `${tier.min_points.toLocaleString("en-US")} points`}
          </p>
          <p className="text-sm text-text-primary">{tier.benefits}</p>
        </li>
      ))}
    </ol>
  );
}
