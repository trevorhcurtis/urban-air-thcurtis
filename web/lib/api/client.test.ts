import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";

const ISSUE = {
  code: "search_timeout",
  title: "Search is taking longer than usual",
  message: "Please try again in a moment.",
  retry_allowed: true,
  blocking: true,
};

function envelope(ok: boolean, issue: typeof ISSUE | null = null, status = ok ? 200 : 503) {
  return new Response(
    JSON.stringify({ ok, data: ok ? { flights: [] } : null, errors: [], meta: { request_id: "req-1" }, simulated_issue: issue }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

describe("api autoRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a retryable issue with exponential backoff until it succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(envelope(false, ISSUE))
      .mockResolvedValueOnce(envelope(false, ISSUE))
      .mockResolvedValueOnce(envelope(true));
    vi.stubGlobal("fetch", fetchMock);

    const pending = api("/search", { method: "POST", body: {}, autoRetry: 2 });
    await vi.advanceTimersByTimeAsync(400);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(800);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const result = await pending;
    expect(result.ok).toBe(true);
    expect(result.issue).toBeNull();
  });

  it("stops after two automatic retries and returns the issue for a manual retry", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => envelope(false, ISSUE));
    vi.stubGlobal("fetch", fetchMock);

    const pending = api("/search", { autoRetry: 2 });
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.issue?.code).toBe("search_timeout");
    expect(result.issue?.request_id).toBe("req-1");
  });

  it("does not retry when the issue is not retryable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(envelope(false, { ...ISSUE, retry_allowed: false }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api("/bookings/confirm", { method: "POST", body: {}, autoRetry: 2 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.issue?.retry_allowed).toBe(false);
  });

  it("does not retry at all unless autoRetry is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(envelope(false, ISSUE));
    vi.stubGlobal("fetch", fetchMock);

    await api("/bookings/confirm", { method: "POST", body: {} });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
