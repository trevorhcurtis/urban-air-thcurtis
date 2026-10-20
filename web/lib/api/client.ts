/**
 * Browser-side API client. Calls go through the Next.js proxy at /api/v1 so the PHP
 * service stays private. Every response is unwrapped from the standard envelope.
 */

export type ApiIssue = {
  code: string;
  title: string;
  message: string;
  retry_allowed: boolean;
  blocking: boolean;
  /** Support reference for the request that raised the issue. */
  request_id?: string | null;
} | null;

export type ApiError = { code?: string; field?: string; message: string };

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  errors: ApiError[];
  issue: ApiIssue;
  /** Field-level errors keyed by field name, for inline display. */
  fieldErrors: Record<string, string>;
};

const UNREACHABLE: ApiError = {
  code: "network",
  message: "We could not reach Urban Air right now. Check your connection and try again.",
};

export type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /**
   * Automatic retries for simulated issues marked retry_allowed, with exponential backoff.
   * Opt in only for calls that are safe to repeat. Anything that creates a booking keeps this at 0.
   */
  autoRetry?: number;
};

const RETRY_BASE_MS = 400;

export async function api<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const maxRetries = options.autoRetry ?? 0;
  let result = await request<T>(path, options);
  for (let attempt = 0; attempt < maxRetries && result.issue?.retry_allowed; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * 2 ** attempt));
    result = await request<T>(path, options);
  }
  return result;
}

async function request<T>(path: string, options: ApiOptions): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: options.method ?? "GET",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, data: null, errors: [UNREACHABLE], issue: null, fieldErrors: {} };
  }

  let json: { ok?: boolean; data?: T; errors?: ApiError[]; simulated_issue?: ApiIssue; meta?: { request_id?: string } } = {};
  try {
    json = await response.json();
  } catch {
    json = { ok: false, errors: [{ message: "Something unexpected happened. Please try again." }] };
  }

  const errors = json.errors ?? [];
  const fieldErrors: Record<string, string> = {};
  for (const error of errors) {
    if (error.field && !fieldErrors[error.field]) fieldErrors[error.field] = error.message;
  }

  const requestId = json.meta?.request_id ?? null;
  const issue = json.simulated_issue ? { ...json.simulated_issue, request_id: requestId } : null;

  return {
    ok: response.ok && json.ok === true,
    status: response.status,
    data: (json.data ?? null) as T | null,
    errors,
    issue,
    fieldErrors,
  };
}
