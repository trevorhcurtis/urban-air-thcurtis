# Urban Air web

Next.js 16 (App Router, React 19, Tailwind v4). Browser calls go through a route handler that proxies to the PHP API, so the API stays private.

The package manager is **pnpm** (version pinned in `package.json`). Do not use npm or yarn: `package-lock.json` is git-ignored, and `pnpm-lock.yaml` is the lockfile.

## Setup

1. Install pnpm. Either run `corepack enable` (it uses the version in `packageManager`), or install pnpm 11 directly.
2. `pnpm install`
3. Copy `.env.example` to `.env.local` and set:
   - `API_BASE_URL`: the PHP API origin, for example `http://127.0.0.1:8080`
   - `SESSION_SECRET`: at least 32 random characters. The app refuses to run without it.
4. `pnpm run dev`, then open http://localhost:3000

The PHP API must be running on `API_BASE_URL` for booking and profile pages to load. See the root [README](../README.md) for how to start it.

## Structure

- `app/` pages and route handlers. `app/api/session`, `app/api/trips`, and `app/api/profile` set signed cookies. `app/api/v1/[...path]` is the API proxy.
- `components/` UI primitives (`ui/`), booking components (`booking/`), and the header, footer, and logo (`layout/`).
- `design-system/` design tokens, the token build, and the token and contrast tests. See [docs/design-system.md](docs/design-system.md).
- `lib/` API client, cookie signing, validation (mirrors `api/src/Services/Validator.php`), pricing, sorting, and formatting.
- `e2e/` Playwright end-to-end, accessibility, zoom, and page screenshot tests. `visual/` Playwright tests for the Storybook stories and interactive states.
- `docs/interactions.md` describes how hover and tap behave.
- `docs/security-checklist.md` lists what was checked and what remains.
- `/styleguide` shows tokens and components in development only. It returns 404 in production.

## Theme

The app has one light theme. There are no dark tokens, dark variants, or dark-mode rules. Do not add them. The brand board specifies light values only.

## Scripts

Run these from `web/`.

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies from `pnpm-lock.yaml` |
| `pnpm run dev` | Development server on port 3000. Regenerates the token CSS first |
| `pnpm run build` | Production build. Regenerates the token CSS first |
| `pnpm start` | Serves the production build (run `build` first). Add `-p <port>` to change the port |
| `pnpm run tokens` | Regenerates `app/tokens.generated.css` and `design-system/tokens.resolved.json` from the token JSON |
| `pnpm run lint` | ESLint, including the rule that bans raw hex and arbitrary values in `app/` and `components/` |
| `pnpm exec tsc --noEmit` | TypeScript type check |
| `pnpm test` | Vitest unit and design-system tests |
| `pnpm run check` | Tokens, lint, type check, and unit tests. Run this before committing |
| `pnpm run storybook` | Storybook on port 6006 |
| `pnpm run build-storybook` | Static Storybook in `storybook-static/` |
| `pnpm run visual:stories` | Builds Storybook, then runs the story screenshot, interactive state, and story axe specs |
| `pnpm figma generate` | Writes the Figma scripts to `design-system/figma/out/` (git-ignored). See [docs/design-system.md](docs/design-system.md#figma) |
| `node design-system/figma/sync.ts verify <snapshot files>` | Compares snapshots read back from the Figma file with the token and component payload |
| `pnpm run visual:update` | Updates every visual baseline (stories, then pages). Review the images before committing |
| `pnpm exec playwright test` | End-to-end and accessibility tests. Starts the PHP API and a production server, so run `pnpm run build` first |
| `pnpm audit --prod` | Production dependency audit (clean). The full `pnpm audit` reports one dev-only advisory, `braces` |

## Notes

- Booking and profile pages render per request because they read visitor cookies. This is configured with `PerRequest` and `connection()`.
- `pnpm run dev`, `build`, and `test` regenerate the tokens before they run, so the generated CSS is never stale. `pnpm run check` is the gate before committing.
- The Playwright config starts the API and a production server itself. Port 8080 must be free, and a stale server on port 3000 must be stopped, or Playwright will serve an old build.
