import type { NextRequest } from "next/server";

/** Forwards browser calls to the PHP API. The PHP host is never exposed to the browser. */
const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";
/** Shared with the PHP API (API_PROXY_SECRET there). Unset in local dev, where the API checks nothing. */
const PROXY_SECRET = process.env.API_PROXY_SECRET;

/**
 * The visitor's address, as the proxy sees it. PHP rate-limits on this, because every browser
 * request reaches PHP from this server. Only this route sets the header, so a browser cannot
 * send its own value through.
 */
function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

async function forward(request: NextRequest, path: string[]): Promise<Response> {
  const target = `${BASE}/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const body = request.method === "GET" ? undefined : await request.text();

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Client-IP": clientIp(request),
        ...(PROXY_SECRET ? { "X-Proxy-Secret": PROXY_SECRET } : {}),
      },
      body,
      cache: "no-store",
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { ok: false, data: null, errors: [{ code: "upstream_unavailable", message: "Urban Air is temporarily unavailable. Please try again." }], meta: {}, simulated_issue: null },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  return forward(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: Ctx) {
  return forward(request, (await params).path);
}
