# Security checklist (Step 8.1)

Checked on 2026-10-15 against the code in git.

| Area | Status | Notes |
|---|---|---|
| Secrets not in repo | Done | `api/.env` and `web/.env.local` are git-ignored. `web/.env.example` has placeholders only. |
| Session cookies signed | Done | HMAC-SHA256, constant-time compare, 24-hour expiry checked on read. Tests cover tampering and expiry. |
| Cookie flags | Done | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production, `Max-Age=86400`. |
| Cookie size cap | Done | Writes over 3,800 bytes are refused. |
| Input sanitizing on session writes | Done | `sanitizeSession` keeps only known keys and caps list sizes. |
| SQL injection | Done | Every query uses prepared statements. `PDO::ATTR_EMULATE_PREPARES` is off. Column names come from fixed lists. |
| Payment data handling | Done | Format checks only. Card fields are not stored, not in the cookie, and not logged. Confirm does not accept card data. Client memory is cleared after purchase. |
| API not publicly reachable | Done (needs production config) | The PHP API returns 403 unless `X-Proxy-Secret` matches `API_PROXY_SECRET`. Set the same value in both apps. Without it, the API accepts any caller. Checked 2026-10-16 with `php -S`. |
| Rate limiting | Done | Per visitor address, 120 requests per minute by default (`RATE_LIMIT_PER_MINUTE`). Server-side renders are not counted against one shared bucket. Checked 2026-10-16. |
| Visitor address trust | Open | The web proxy takes the first `X-Forwarded-For` value, which a browser can set. Confirm what the hosting proxy sends. |
| PHP error display | Done | `display_errors` is off in `api/public/index.php`. Errors go to the PHP error log. |
| Web server headers | Done | Adds `Strict-Transport-Security` (HTTPS only) and removes `X-Powered-By`. |
| Apache routing | Done (verify on host) | `api/public/.htaccess` sends all requests to `index.php` and turns off directory listings. Not tested under Apache here. |
| Request logging | Done | One line per request. No bodies, no IPs, no card data. |
| Security headers | Done | CSP (self only, inline allowed for Next), `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restricted permissions policy. |
| CSP strictness | Open | `unsafe-inline` is needed for the Next runtime. A nonce-based CSP would remove it. |
| CSRF | Accepted risk | Cookie writes are JSON-only and checked by the browser's `SameSite=Lax`. The prototype has no real account actions. |
| Error messages | Done | Responses use generic messages. Stack traces go to the PHP error log only. |
| Dependency audit | Done (re-run before deploying) | `pnpm audit --prod`: 0 vulnerabilities. The full `pnpm audit` reports one dev-only advisory (`braces`). `composer audit --locked`: no advisories. Re-run before any real deployment. Last run 2026-10-16. |
| Simulated errors in production | Open (owner decision) | `SIMULATE_ERRORS=true` in the local `api/.env` makes random booking failures. Decide whether production should set it to `false`. |
| Production build and tests | Done | On 2026-10-16: `pnpm run check` (268 tests), `pnpm run build`, PHPUnit (50 tests), and Playwright (67 passed, 23 skipped) all pass. |
| Real authentication | Out of scope | The prototype has no accounts. |
