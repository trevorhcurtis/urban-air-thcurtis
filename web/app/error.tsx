"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";

/** Shown when a page fails. Keeps the header and footer, and offers a retry. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <Heading level={1} size={2} brand>Something went wrong on our side</Heading>
      <p className="text-text-muted">Your selections are saved for this visit. Try again, or head back to the home page.</p>
      {error.digest && <p className="text-xs text-text-muted">Reference: {error.digest}</p>}
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">Home</ButtonLink>
      </div>
    </main>
  );
}
