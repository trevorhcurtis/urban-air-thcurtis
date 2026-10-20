# Urban Air API

A small PHP 8.2+ JSON API. It serves reference data, generates the sample flights, validates input, and simulates booking. It stores no visitor data.

## Setup

1. Create the database and user:

   ```sql
   CREATE DATABASE urbanair CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'ua_app'@'localhost' IDENTIFIED BY 'choose-a-password';
   GRANT ALL PRIVILEGES ON urbanair.* TO 'ua_app'@'localhost';
   ```

2. Create `api/.env` (git-ignored):

   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=urbanair
   DB_USER=ua_app
   DB_PASS=choose-a-password
   SIMULATE_ERRORS=true
   RATE_LIMIT_PER_MINUTE=120
   # Production only: the same value as API_PROXY_SECRET in web/.env.local. Leave unset in development.
   # API_PROXY_SECRET=
   ```

   In production, set `API_PROXY_SECRET`. Without it, the API accepts calls from anyone who can reach it.

3. Install and migrate:

   ```bash
   composer install
   php scripts/migrate.php
   ```

4. Serve: `php -S 127.0.0.1:8080 -t public`

## Data lifecycle

- The first request after 24 hours rebuilds all sample data (`ReseedService::ensureFresh`).
- You can also reseed by hand: `php scripts/reseed.php`. Use `--if-stale` to reseed only when needed.
- To reseed from cron every night at 03:00:

  ```
  0 3 * * *  cd /path/to/urbanair/api && php scripts/reseed.php >> storage/reseed.log 2>&1
  ```

- A MySQL named lock (`urbanair_reseed`) stops two reseeds from running at once.

## Endpoints (v1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/meta/status` | Last and next reseed times |
| GET | `/api/v1/airports` | Airports |
| GET | `/api/v1/routes` | The six bookable route pairs |
| POST | `/api/v1/search` | Validated search. Returns all 40 flights, labelled with the searched route |
| GET | `/api/v1/flights/{id}` | Flight detail. May simulate a fare change |
| GET | `/api/v1/flights/{id}/seatmap` | Layout and seat status |
| POST | `/api/v1/bookings/validate-passengers` | Server-side passenger rules |
| POST | `/api/v1/bookings/validate-payment` | Card format checks only. Not stored or logged |
| POST | `/api/v1/bookings/confirm` | Simulated confirmation. Persists nothing |
| GET | `/api/v1/partners`, `/rewards/tiers`, `/seat-features` | Reference content |

Every response uses this envelope:

```json
{ "ok": true, "data": {}, "errors": [], "meta": { "request_id": "..." }, "simulated_issue": null }
```

A blocking simulated issue returns HTTP 503 with `simulated_issue` set. The informational `fare_changed` issue returns 200.

## Simulated errors

`SIMULATE_ERRORS=true` enables random issues from the `error_scenarios` table. Set `SIMULATE_ERRORS_SEED` to make them reproducible for a given request.

## Rate limiting and logs

- Each visitor address gets `RATE_LIMIT_PER_MINUTE` requests per minute (0 turns it off). The web proxy sends the visitor's address in `X-Client-IP`. Keep this API off the public internet so only the proxy can reach it.
- `storage/requests.log` gets one line per request: time, request ID, method, status, and duration. Bodies, card data, and IP addresses are never written.

## Tests

`vendor/bin/phpunit` runs unit tests for the router, validator, error simulator, seat generator, XML schemas, rate limiter, and planner. The reseed integration test runs only when `UA_TEST_DB_NAME` is set in `.env` (it uses a separate database).
