![urban-air-logo.webp](urban-air-logo.webp)

# Urban Air Prototype

An interactive airline booking prototype: consisting of a Next.js front end and a lightweight PHP + MySQL JSON API. Every booking, payment, and profile value is simulated. Nothing is stored on the server; bookings and profile details live only in the visitor's browser, in signed cookies with a 24-hour hold.

The prototype covers round-trip and one-way search, flight choice with fare classes, passenger details, seat selection on four aircraft types, a review step, fake payment, a confirmation page, a trips list, rewards, and partners. Sample data reseeds every 24 hours.

See Urban Air running live at [https://urbanair.rovitix.com](https://urbanair.rovitix.com).

## Layout

| Path | What it is |
|---|---|
| `web/` | Next.js 16 app (App Router, React 19, Tailwind v4). See [web/README.md](web/README.md). |
| `web/design-system/` | Design tokens, their schema, the build, and the token tests |
| `api/` | PHP 8.2+ JSON API, MySQL schema, seed and reseed scripts. See [api/README.md](api/README.md). |

## Requirements

Verified on macOS with Node 26, pnpm 11, PHP 8.3, and MariaDB 13. The app needs Node 20.9 or later (the Next.js 16 minimum), pnpm 11, PHP 8.2 or later, Composer, and MySQL 8 or MariaDB. pnpm is the only package manager for the web app; do not use npm or yarn.

## Quick start

1. Start MariaDB or MySQL and create a database and user (see [api/README.md](api/README.md)).
2. Set up the API: `cd api && composer install && php scripts/migrate.php`.
3. Set up the web app: `cd web && pnpm install`, then copy `web/.env.example` to `web/.env.local` and set `SESSION_SECRET` (at least 32 characters). The app will not start without it.
4. Run both:
   - `php -S 127.0.0.1:8080 -t api/public`
   - `cd web && pnpm run dev`
5. Open http://localhost:3000.

The first API request after 24 hours rebuilds the sample data. To reseed by hand, run `php scripts/reseed.php` in `api/`. The cron setup is in [api/README.md](api/README.md).

## Design system

The design system is mirrored in a [Figma file](https://www.figma.com/design/NNDbn0bOh7XkD2vb32KoAL/Urban-Air-Design-System) for review. See [Figma](#figma) below.

### Figma

The [Urban Air Design System Figma file](https://www.figma.com/design/NNDbn0bOh7XkD2vb32KoAL/Urban-Air-Design-System) holds the design system as Figma variables, styles, and components. The repo is the source of truth. The file is built from the tokens and component contracts, and it is not edited by hand.

- **Variables** in three collections: `Primitives` (raw colors, radii, sizes, and font sizes), `Semantic` (light-mode meanings, each with its CSS variable as WEB code syntax), and `Component` (one token per component part, such as `button/primary/bg` or `alert/info/border`).
- **Text styles** `Type/UI/*` and `Type/Brand/*` for each type size, plus `Type/UI/label`. Shadows are effect styles: `shadow/card`, `shadow/popover`, and `shadow/modal`.
- **Components** on the `Components` page: Button, Button States, Badge, Input, Card, Alert, Toast, Heading, Text, Toggle, Divider, and Skeleton. Each variant axis comes from the component's contract in `web/components/ui/`, and each size or spacing value comes from the theme tokens.

To update the file after a change in the repo:

```
cd web
pnpm figma generate                  # writes the Figma scripts to design-system/figma/out/
# run each script through the Figma MCP use_figma tool, then read back the snapshots
node design-system/figma/sync.ts verify <snapshot files>
```

The sync matches items by name, so a rerun updates them in place. The verifier exits non-zero on any mismatch. The full steps, and what Figma does not draw (for example, the Alert's left edge and the Toast's auto-dismiss), are in [web/docs/design-system.md](web/docs/design-system.md#figma). The Figma file is not published as a team library. It is for review.

### Principles

- **Tokens, not values.** Components never use raw hex colors or arbitrary Tailwind values. Every color, size, radius, shadow, and duration comes from a token.
- **Light theme only**. There are no dark tokens.
- **Accessible by default.** Text meets 4.5:1 and control boundaries and focus meet 3:1, checked against resolved values (see `web/design-system/tests/contrast.test.ts`). Interactive blue for text and controls is `#0066CC`.
- **Brand type, functional type.** Sora 800 is for brand headlines only: the home, rewards, partners, error, not-found, and confirmation headings, and the wordmark. Inter is used for all other UI text, including booking and account headings. The `Heading` component rejects the brand face below level 2.
- **Status is never color alone.** Each status is a word with a badge or icon.

### File structure

```
web/
├── design-system/
│   ├── tokens/
│   │   ├── primitives.json   raw values only (navy, blue, mist, green, neutrals, status)
│   │   ├── semantic.json     meanings that reference primitives: text, surface, solid, border
│   │   └── theme.json        font families, type scale, radii, control heights, shadows, durations
│   ├── schema/
│   │   └── tokens.schema.json   shape of every token file
│   ├── resolve.mjs           loads, validates, and resolves references; rejects cycles and raw values in the semantic layer
│   ├── build-tokens.mjs      writes the two generated files below
│   ├── tokens.resolved.json  generated: resolved semantic colors (read by the styleguide)
│   ├── figma/                typed sync from the tokens and contracts to the Figma file (see Figma below)
│   │   ├── types.ts          payload, scene, and snapshot shapes
│   │   ├── payload.ts        builds Figma variables, text styles, and effect styles from the tokens
│   │   ├── component-tokens.ts  component tokens, each aliasing a semantic or primitive token
│   │   ├── components.ts     component definitions: variants from contracts, geometry from theme tokens
│   │   ├── units.ts          parses px, rem, ms, and shadow values
│   │   ├── verify.ts         compares a snapshot read back from Figma with the payload
│   │   ├── sync.ts           CLI: `generate` writes the Figma scripts, `verify` checks snapshots
│   │   ├── package.json      marks this folder as ES modules for Node
│   │   ├── use-figma/        scripts that run inside Figma through the use_figma tool
│   │   └── out/              generated scripts and snapshots (git-ignored)
│   └── tests/
│       ├── contrast.test.ts  WCAG contrast on resolved values
│       ├── figma.test.ts     Figma payload, verifier, and component geometry checked against the code
│       └── tokens.test.ts    token rejection tests, generated-file drift, no raw values in components
├── app/
│   ├── tokens.generated.css  generated: Tailwind theme and :root primitives (do not edit)
│   ├── globals.css           imports the generated theme; focus outline; reduced motion
│   ├── layout.tsx            root layout: fonts, header, footer
│   ├── page.tsx              home page
│   ├── error.tsx, not-found.tsx   error and 404 pages
│   ├── api/                  route handlers that proxy to the PHP API and sign the session and trips cookies
│   ├── book/                 booking flow: search, flights, passengers, seats, review, confirmation
│   ├── profile/              account details and trips
│   ├── rewards/, partners/, help/   rewards, partner, and help pages
│   └── styleguide/           dev-only page showing every token and component (404 in production)
├── .storybook/
│   ├── main.ts               Storybook config: Next.js Vite framework, Tailwind Vite plugin, telemetry off
│   └── preview.tsx           loads globals.css and the app fonts for every story
├── components/
│   ├── ui/                   primitives: Button, Input (text, select, textarea, date), Checkbox, Radio,
│   │                         Toggle, Heading, Text, Badge, Alert, Toast, Modal, Drawer (both on Dialog),
│   │                         Disclosure, Card, Table, SortBar, Tabs, Pagination, Progress, Avatar,
│   │                         EmptyState, IssueBanner, Divider, Icon, Link, Tooltip, and others
│   │                         Stories: *.stories.tsx next to each primitive group
│   │                         Contracts: <Name>.contract.json for primitives with variant props
│   ├── booking/              airline patterns: AirportCombobox, FlightSearchPanel, FlightCard, FareCard,
│   │                         FlightStatusPanel, PassengerSelector, SeatMap, BoardingPass, Stepper, StepIssues.
│   │                         Stories: Booking.stories.tsx, FlightStatusPanel.stories.tsx
│   └── layout/               header, footer, logo, and the per-request rendering wrapper
├── lib/                      shared logic: API client and server helpers, pricing, validation, session cookies,
│                             formatting, sorting, and flight status. Tests sit beside the code
├── public/                   static assets served as-is
├── docs/
│   ├── design-system.md      rules the tests enforce, how to add a primitive, and the Figma sync steps
│   ├── interactions.md       hover and tap rules
│   └── security-checklist.md what was checked and what remains
├── e2e/                      Playwright end-to-end, accessibility, zoom, and page visual tests
├── visual/                   Playwright tests for Storybook stories and interactive states
├── package.json              pnpm scripts (see the command table above); pnpm-lock.yaml and pnpm-workspace.yaml
├── next.config.ts            Next.js config
├── tsconfig.json, eslint.config.mjs, vitest.config.ts, playwright.config.ts, playwright.stories.config.ts
│                             type check, lint (including the raw-value rules), unit tests, and browser test configs
├── storybook-static/         generated static Storybook (git-ignored)
└── test-results/             Playwright output (git-ignored)
```

Outside `web/`:

```
api/                          PHP API: src/ (controllers, domain, repositories, services, support),
                              database/schema.sql, scripts/ (migrate, reseed), data/ (XML layouts), tests/
```

### Changing a token

1. Edit the JSON in `web/design-system/tokens/`. Put raw values in `primitives.json` only. `semantic.json` must reference primitives with `{group.name}`.
2. Run `cd web && pnpm run tokens` to regenerate `app/tokens.generated.css` and `design-system/tokens.resolved.json`.
3. Run `cd web && pnpm run check`. It runs the token build, lint, type checks, and all unit tests, including the contrast checks.

### Using tokens in components

Use the semantic class names that the token build generates:

| Need | Classes |
|---|---|
| Text color | `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-link`, `text-text-inverse`, `text-text-error` |
| Surfaces | `bg-surface-canvas`, `bg-surface-brand`, `bg-surface-interactive`, `bg-surface-destructive`, `bg-surface-error` |
| Status | `bg-surface-success` with `text-text-success` (surface and text as a pair), `border-solid-error` for edges |
| Control boundaries | `border-border-default` (inputs, selects, toggles, buttons on canvas) |
| Decorative edges | `border-border-subtle` (cards and dividers only, never controls) |
| Type | `text-md`, `text-sm`, `text-lg`, `text-h1` to `text-h4`, `text-display`, `font-brand` (brand headlines only) |
| Shape and size | `rounded-md` (controls), `rounded-lg` (cards), `min-h-control-md` (44px), `h-control-lg` (48px) |
| Elevation | `shadow-card`, `shadow-popover`, `shadow-modal` |

Do not write hex values, arbitrary sizes such as `text-[11px]`, or default Tailwind colors such as `text-red-700`. Those classes render nothing, and the token tests fail when they appear. Variant brackets such as `aria-[current=page]` are allowed.

### Viewing the components

- **Styleguide:** run the dev server (`cd web && pnpm run dev`) and open http://localhost:3000/styleguide. It shows the colors, type scale, buttons and states, form controls, status tones, spacing, radii, shadows, and interactive examples.
- **Storybook:** documents the primitives and the airline patterns, one story per state.
  - Run it: `cd web && pnpm run storybook`, then open http://localhost:6006.
  - Build a static copy: `cd web && pnpm run build-storybook`. Output goes to `web/storybook-static/` (ignored by git).
  - Stories sit next to their components as `*.stories.tsx`. Configuration is in `web/.storybook/`. The preview loads `app/globals.css` and the same fonts as the app, so stories show the real tokens.
  - Storybook shows components. The styleguide page shows tokens together with the components.
- **Contributor notes:** `web/docs/design-system.md` lists the rules the tests enforce and how to add a primitive.

## Accessibility

The target is WCAG 2.2 AA. The checks below run automatically; the gaps at the end need a person.

### Standard

- Text meets 4.5:1 contrast and control boundaries and focus meet 3:1, checked on resolved token values, not on source names (`web/design-system/tests/contrast.test.ts`). Control states such as hover, pressed, and error are encoded as named tests.
- Color never carries meaning alone. Status is a word with a badge or icon, and errors have text and an icon.
- Focus is always visible. The focus outline uses the `border-focus` token (`#0066CC`, 5.6:1 on white). The old focus tint did not meet 3:1.
- Targets are at least 44px on touch. Controls use `min-h-control-md` (44px) or larger.
- Motion is reduced when the traveler asks for it. Animations use `motion-safe:` or `motion-reduce:`, and the global reduced-motion rule is in `web/app/globals.css`.

### Keyboard and touch

Interactive primitives have unit tests for keyboard and touch behavior in `web/components/ui/primitives.test.tsx` and `web/components/booking/booking.test.tsx`:

- **Dialogs (Modal, Drawer):** focus moves in on open and returns to the opener on close. Tab and Shift+Tab wrap. Esc closes. A tap on the backdrop closes. The drawer also has a visible Close button. Both render into `document.body`.
- **Tabs:** arrow keys, Home, and End move and select. Only the selected tab is in the tab order.
- **Disclosure (accordion):** a native `details` element. Its summary is at least 44px and uses the global focus outline.
- **Airport combobox:** arrow keys move through results, Enter chooses, Esc closes, Home and End jump. A tap chooses directly.
- **Passenger selector:** the buttons stop at 1 and 9, and the count is announced politely.
- **Fare restrictions:** the tooltip opens on hover, focus, or tap. Tapping it does not select the fare class.
- **Toggle:** a native button with `role="switch"` and an explicit on or off state. Space and Enter work because it is a native button.
- **Toast and table:** the dismiss control is a native button. Sortable headers are native buttons that set `aria-sort`.
- **Seat map:** arrow keys move between seats, and Enter selects. A Seat map and List view toggle gives a tap-first list of seats in the traveler's fare class. Each seat has a label with its status and features. The arrow keys are covered by an end-to-end test, not a unit test.

### Automated scans

- `web/e2e/accessibility.spec.ts` runs axe-core with the WCAG 2.0 A and AA and WCAG 2.1 AA tags. It fails on any serious or critical violation. It scans each of these at 375, 768, 1024, and 1440 px:
  - the five public pages: home, rewards, partners, profile, and help;
  - the round-trip booking pages: search, flights, passengers, seats, and review;
  - the one-way booking pages, including the confirmation page.
- `web/visual/stories.accessibility.spec.ts` runs the same scan on every Storybook story.

Each scan runs after the page reaches the network-idle state.

### Reflow and long labels

`web/e2e/zoom.spec.ts` checks that content reflows without sideways scrolling at 320 px (WCAG 1.4.10) and 640 px (about 200% zoom on a 1280 px screen). It checks the public pages. It also fills the passenger form with long names and emails at 320 px, and checks that every visible label and error message stays inside the viewport.

## Tests

Run these from the repository root.

| Suite | Command | What it covers |
|---|---|---|
| Web unit and design-system | `cd web && pnpm test` | Validation rules, cookie session, sorting, pricing, the API client's retry behavior, the flight status panel, every primitive's keyboard and touch behavior, component contracts, token resolution and rejection, the contrast checks, and the rule that bans raw values in components. |
| Full check | `cd web && pnpm run check` | Regenerates the token CSS, then runs lint, the type check, and the unit suite. This is the check to run before committing. |
| Lint and types | `cd web && pnpm run lint && pnpm exec tsc --noEmit` | ESLint and TypeScript on the whole web app. |
| API | `cd api && vendor/bin/phpunit` | Flight planning and status, seat generation, validators, the error simulator, the rate limiter, the reseed integration, the XML layout schema, the repositories, the router, the response envelope, and env loading. The tests do not call the HTTP endpoints directly. The reseed integration test runs only when `UA_TEST_DB_NAME` is set in `api/.env`. |
| End-to-end and accessibility | `cd web && pnpm run build && pnpm exec playwright test` | Round-trip and one-way booking to confirmation on the desktop and mobile (Pixel 7) projects, validation errors, simulated error recovery, the profile save, the phone menu, the seat map on all four aircraft types, the zoom and reflow checks, and the axe scans listed above. The Playwright config starts both servers itself. Port 8080 must be free, and a stale server on port 3000 must be stopped, or it will serve an old build. |
| Storybook visual and accessibility | `cd web && pnpm run visual:stories` | Builds Storybook, then compares a screenshot of every story and its interactive states (hover, focus, pressed) with its baseline, and runs the axe scan on every story. |

Checks run locally. The repository has no CI.

At the last full run (2026-10-16), the unit and design-system suite passed 239 tests in 13 files, PHPUnit passed 50 tests, and Playwright passed 67 tests with 23 skipped. Playwright runs every test on a desktop and a phone project. Viewport-specific tests skip on the other project, and the visual page tests run on desktop only.

### Visual regression

`web/e2e/visual.spec.ts` takes full-page screenshots of the home, search, rewards, partners, and help pages at 375, 768, 1024, and 1440 px, and compares them with the baselines in `web/e2e/visual.spec.ts-snapshots/`.

- The browser clock is fixed, so the search form's default dates stay the same.
- Animations are disabled, and fonts are loaded before each screenshot.
- Baselines are recorded on the desktop project only. Their file names end in `-darwin`, so they match macOS rendering. On another platform, regenerate them.
- After an intended visual change, run `cd web && pnpm exec playwright test e2e/visual.spec.ts --update-snapshots`, then review the changed images before committing them.
- The comparison fails on more than 1% of pixels differing. This was checked by swapping one baseline for another page's image, which failed as expected.

#### Storybook stories and states

`web/visual/` holds two Playwright specs that run from their own config, `web/playwright.stories.config.ts`, against the static Storybook build. The main end-to-end run does not need Storybook.

- `stories.visual.spec.ts` screenshots each story's root at 768 px, one image per story.
- `states.visual.spec.ts` drives real hover, focus, and pressed states for the Button variants and the form controls, then compares each one.
- `stories.accessibility.spec.ts` runs the axe scan on every story.
- Run all three with `cd web && pnpm run visual:stories`. The script builds Storybook first.
- After an intended change, run `cd web && pnpm run visual:update`. It updates the story baselines and the page baselines, so review the changed images before committing them.
- The same 1% limit applies. The check was done by swapping one story's baseline for another, which failed as expected.

### Notes for contributors

- Adding a token: edit `web/design-system/tokens/`, then run `cd web && pnpm run tokens`. See the design system section above.
- Adding a primitive: write its keyboard and touch test, add a story, and add a `.contract.json` if it has variant props. `web/docs/design-system.md` lists the rules the tests enforce.
- Adding a booking rule: keep the client rule in `web/lib/validation/rules.ts` and the server rule in `api/src/Services/Validator.php` in step, with the same error codes on both sides.
- The end-to-end tests use a fixed passenger and a test card (`web/e2e/flow.ts`). Card numbers are synthetic test values and are never stored.
