import "server-only";

/** Server-side fetch to the PHP API, for server components. Never exposed to the browser. */
export async function apiGet<T>(path: string): Promise<T | null> {
  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";
  const secret = process.env.API_PROXY_SECRET;
  try {
    const res = await fetch(`${base}/api/v1${path}`, {
      cache: "no-store",
      headers: secret ? { "X-Proxy-Secret": secret } : undefined,
    });
    const json = (await res.json()) as { ok: boolean; data: T };
    return json.ok ? json.data : null;
  } catch {
    return null;
  }
}
