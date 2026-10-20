import { PerRequest } from "@/components/layout/PerRequest";

/** The profile reads the visitor's trips cookie, so it renders per request. */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <PerRequest fallback={<p role="status" className="py-10 text-text-muted">Loading…</p>}>{children}</PerRequest>;
}
