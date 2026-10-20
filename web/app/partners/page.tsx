import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { PartnersList } from "./PartnersList";
import { Heading } from "@/components/ui/Heading";

export const metadata = { title: "Partners" };

type Partner = { id: number; name: string; category: string; description: string; logo_key: string };

export default function PartnersPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Heading level={1} size={2} brand className="md:text-h1">Partner programs</Heading>
      <p className="mt-3 max-w-2xl text-lg text-text-muted">
        Earn Urban Air points with hotels, rental cars, dining, and more. Filter by category or sort the list.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p role="status" className="text-text-muted">Loading partners…</p>}>
          <Partners />
        </Suspense>
      </div>
    </main>
  );
}

async function Partners() {
  const data = await apiGet<{ partners: Partner[] }>("/partners");
  if (!data) {
    return <p role="status" className="text-text-muted">Partner details are unavailable right now. Please check back shortly.</p>;
  }
  return <PartnersList partners={data.partners} />;
}
