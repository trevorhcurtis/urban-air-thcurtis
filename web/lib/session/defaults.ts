import type { Session } from "./types";

export function emptySession(): Session {
  return {
    search: null,
    outbound: null,
    return: null,
    passengers: [],
    seats: { outbound: [], return: [] },
  };
}

/** Keeps only known keys and sane types. Anything else in a client request is ignored. */
export function sanitizeSession(input: unknown): Session {
  const base = emptySession();
  if (!input || typeof input !== "object") return base;
  const src = input as Partial<Record<keyof Session, unknown>>;

  return {
    search: (src.search as Session["search"]) ?? null,
    outbound: (src.outbound as Session["outbound"]) ?? null,
    return: (src.return as Session["return"]) ?? null,
    passengers: Array.isArray(src.passengers) ? (src.passengers as Session["passengers"]).slice(0, 9) : base.passengers,
    seats: {
      outbound: asStringArray((src.seats as Session["seats"] | undefined)?.outbound),
      return: asStringArray((src.seats as Session["seats"] | undefined)?.return),
    },
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, 9) : [];
}
