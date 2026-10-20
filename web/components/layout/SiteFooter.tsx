import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border-subtle bg-surface-brand">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-text-primary md:flex-row md:items-center md:justify-between">
        <p className="font-semibold">Urban Air. Fly Further Together.</p>
        <p className="text-text-muted">
          This is a prototype. No real bookings, payments, or personal data are processed or stored.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/rewards" className="underline-offset-4 hover:underline">Rewards</Link>
          <Link href="/partners" className="underline-offset-4 hover:underline">Partners</Link>
        </nav>
      </div>
    </footer>
  );
}
