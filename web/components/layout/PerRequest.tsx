import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

/**
 * Marks its children as per-request. The dynamic access sits inside Suspense, so the shell
 * still streams while the page waits for the visitor's cookies.
 */
export function PerRequest({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <Dynamic>{children}</Dynamic>
    </Suspense>
  );
}

async function Dynamic({ children }: { children: ReactNode }) {
  await connection();
  return children;
}
