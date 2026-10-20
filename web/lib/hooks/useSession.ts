"use client";

import { useCallback, useEffect, useState } from "react";
import { emptySession } from "@/lib/session/defaults";
import type { Session } from "@/lib/session/types";

/**
 * Loads the signed booking session from /api/session and saves patches back to it.
 * `ready` is false until the first load finishes, so pages can wait before guarding.
 */
export function useSession() {
  const [session, setSession] = useState<Session>(emptySession());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { session: Session }) => active && setSession(json.session))
      .catch(() => active && setError("We could not load your booking. Refresh the page to try again."))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (patch: Partial<Session>): Promise<boolean> => {
    const res = await fetch("/api/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json()) as { session?: Session; error?: string };
    if (!res.ok || !json.session) {
      setError(json.error ?? "We could not save your selections. Please try again.");
      return false;
    }
    setSession(json.session);
    setError(null);
    return true;
  }, []);

  const reset = useCallback(async () => {
    await fetch("/api/session", { method: "DELETE" });
    setSession(emptySession());
  }, []);

  return { session, ready, error, save, reset };
}
