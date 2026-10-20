# Design system: notes for contributors and agents

This file is the short version. The rules live in the places named below. If this file and the code disagree, the code and its tests win.

## Where things are

- Figma design system file (variables, text and effect styles, and twelve component sets): https://www.figma.com/design/NNDbn0bOh7XkD2vb32KoAL/Urban-Air-Design-System. See the Figma section below. The JSON in `web/design-system/tokens/` stays the source of truth.
- Token source: `web/design-system/tokens/` (`primitives.json`, `semantic.json`, `theme.json`).
- Token schema: `web/design-system/schema/tokens.schema.json`.
- Generated (do not edit): `web/app/tokens.generated.css`, `web/design-system/tokens.resolved.json`.
- Primitives: `web/components/ui/`. Airline patterns: `web/components/booking/`.
- Stories: `*.stories.tsx` next to each component group. Storybook config: `web/.storybook/`.

## Rules that the tests enforce

1. **Tokens only.** No hex colors in `app/` or `components/`. ESLint flags them while you edit (`web/eslint.config.mjs`), and `tokens.test.ts` checks them in the full run. No arbitrary values in class names such as `text-[11px]` or `grid-cols-[auto_1fr]`; layout values are theme tokens (`aspect-photo`, `grid-cols-label`, `grid-cols-split`). Variant brackets such as `aria-[current=page]` are allowed. No default Tailwind colors such as `text-red-700`, which the build clears so they render nothing.
2. **Semantic classes.** Use `text-text-*`, `bg-surface-*`, `bg-solid-*`, `border-border-*`. Primitives reference only semantic tokens. Raw values belong in `primitives.json`.
3. **Contrast.** Text is at least 4.5:1 on every surface it sits on. Control boundaries and focus are at least 3:1 (`contrast.test.ts`, on resolved values).
4. **Decorative borders are not controls.** `border-border-subtle` is for card edges and dividers. Inputs, selects, toggles, chips, and buttons use `border-border-default`.
5. **Brand face only on marketing headings.** Sora 800 (`font-brand`) is for the home, rewards, partners, error, not-found, and confirmation headings. The `Heading` type rejects `brand` below level 2. Booking and account headings use Inter.
6. **One theme: light only.** Do not add dark tokens, dark variants, or `prefers-color-scheme` rules. `surface.inverse` is a component surface for specific dark panels, not a theme.
7. **Shared meanings are reviewed.** Two semantic tokens with the same value must be listed in `APPROVED_SHARED_VALUES` in `tokens.test.ts`, with a reason.

## Changing a token

1. Edit the JSON in `web/design-system/tokens/`.
2. Run `pnpm run tokens` in `web/`.
3. Run `pnpm run check`. It regenerates the files, lints, type-checks, and runs the tests.

## Adding or changing a primitive

1. Write it in `web/components/ui/` using semantic classes only.
2. For an interactive component: add a keyboard test and a touch test in `components/ui/primitives.test.tsx` or a sibling `*.test.tsx`. Taps and clicks should do the same thing.
3. Add or update a story next to it. Show each state the component supports.
4. Dialogs and drawers build on `Dialog.tsx`. Do not write a second focus trap.
5. Run `pnpm run check`, then `pnpm run build-storybook` if you changed a story. If the change is intended to alter a screenshot, run `pnpm run visual:stories -- --update-snapshots` and review the new images before committing them.

## Component contracts

Each primitive that takes variant props has a contract file beside it: `components/ui/<Name>.contract.json`. A contract lists the prop values, the default, and the states the component implements.

- The schema is `design-system/schema/component.schema.json`.
- `components/ui/contracts.test.tsx` checks every contract against the schema, and checks that its values match the lists exported by the component. To add a contract, export the component's list and register it in that test.
- A contract lists only states that are implemented. If a state is missing from the code, say so in `notes` rather than listing it.
- Fourteen primitives have contracts: Alert, Avatar, Badge, Button, Card, Divider, Drawer, Heading, Icon, Input, Skeleton, Text, Toast, and Toggle. Card and Input have no variant props, so their contracts list an empty `props` and are registered with `{}`. Primitives without variant props (Checkbox, Radio, Textarea, Select, Modal, Tabs, Table, and others) have none. Add one when you add a variant prop.

## Accessibility baseline

- Visible focus on every interactive element. The global focus outline uses `border-focus`.
- Labels on every field. Errors and help text are linked with `aria-describedby`.
- Color never carries meaning alone. Status is a word plus a badge or icon.
- Targets are at least 44px on touch. Use `min-h-control-md` for controls.
- Reduced motion is respected. Animations use `motion-safe:` or `motion-reduce:`.

## Commands

Run these from `web/` with pnpm. The repository has no CI, so `pnpm run check` is the gate before a commit.

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies from `pnpm-lock.yaml` |
| `pnpm run dev` | Development server on port 3000. Regenerates tokens first. `/styleguide` is available here |
| `pnpm run build` | Production build. Regenerates tokens first |
| `pnpm start` | Serves the production build (run `build` first) |
| `pnpm run tokens` | Regenerates `tokens.generated.css` and `tokens.resolved.json` |
| `pnpm run lint` | ESLint, including the raw-value rule |
| `pnpm exec tsc --noEmit` | Type check |
| `pnpm test` | Vitest unit and design-system tests |
| `pnpm run check` | Tokens, lint, type check, and unit tests. Run before committing |
| `pnpm run storybook` | Storybook on port 6006 |
| `pnpm run build-storybook` | Static Storybook in `web/storybook-static/` |
| `pnpm run visual:stories` | Builds Storybook, then runs the story screenshot, state screenshot, and story axe specs |
| `pnpm run visual:update` | Updates every visual baseline (stories, then pages). Review the images before committing |
| `pnpm exec playwright test` | End-to-end and page accessibility scans. Starts the PHP API and a production server, so run `pnpm run build` first |
| `pnpm audit --prod` | Production dependency audit. The dev-only advisories are listed in the security checklist |

## Figma

The Figma file is [Urban Air Design System](https://www.figma.com/design/NNDbn0bOh7XkD2vb32KoAL/Urban-Air-Design-System). Figma mirrors the design system. The repo is the source of truth: change values in `web/design-system/tokens/` and the code, then update Figma to match. Figma does not feed back into the repo.

- **File:** "Urban Air Design System" (`NNDbn0bOh7XkD2vb32KoAL`), on the `Components` page.
- **Variables, three collections:**
  - `Primitives` (one mode, `Value`): every color, radius, control height, font size, line height, duration, aspect, and grid value from the token files. Scopes are hidden. No code syntax, because the app never reads these directly.
  - `Semantic` (one mode, `Light`): aliases to primitives, one per semantic color. Each has a `WEB` code syntax of `var(--color-…)`, matching the names in `app/tokens.generated.css`.
  - `Component` (one mode, `Value`): aliases to semantic or primitive tokens, named by component (`button/primary/bg`, `input/border-error`, `badge/info/text`, `card/radius`). The map is `design-system/figma/component-tokens.ts`.
- **Text styles:** `Type/UI/<size>` (Inter) for every font size, and `Type/Brand/<size>` (Sora ExtraBold) for `h1`, `h1-mobile`, and `display`.
- **Effect styles:** `shadow/card`, `shadow/popover`, `shadow/modal`, parsed from the shadow tokens.
- **Components:** `Button` (variant × size, 20), `Button States` (variant × state at md, 15), `Input` (state, 4: default, hover, filled, error), `Card` (1), `Badge` (tone, 5), `Alert` (tone, 4), `Toast` (tone, 4), `Heading` (level and brand, 6), `Text` (role, 5), `Toggle` (state, 3), `Divider` (orientation and weight, 4), `Skeleton` (variant, 4). The components bind fills, strokes, and text to `Component` tokens. Card uses `shadow/card`, Toast uses `shadow/popover`, and Heading and Text use the type styles.
- **Gaps:** Figma doesn't draw the Alert's 4px left edge or icon, Toast's auto-dismiss, Toggle's focus ring or label, Skeleton's pulse, or Heading's phone size. Input's focus is the global outline in code, not a variant.
- **Not in Figma:** Button's hover and pressed states live in `Button States`, not in the size set. Padding, control heights, and font sizes on components are literal values.
- **Library:** the file is not published to a team library. It is for portfolio review, so nothing needs to be published.

### Syncing from code

The sync is typed TypeScript in `web/design-system/figma/`:

- `types.ts`: the payload, scene, and snapshot shapes.
- `payload.ts`: builds the variables, text styles, and effect styles from the token JSON.
- `components.ts`: builds the twelve component sets from their contracts plus theme sizes.
- `verify.ts`: compares a snapshot read back from Figma with the payload.
- `use-figma/*.js`: the scripts that run inside Figma. The sync adds the typed data to them.

Commands, from `web/`:

1. `pnpm figma generate` writes the scripts to `design-system/figma/out/` (git-ignored).
2. Run `use-figma/foundations` and `components` through the Figma MCP `use_figma` tool, passing the generated file's contents as `code`. Each script matches by name, so a rerun updates in place. Component sets are rebuilt, and their IDs change.
3. Run the four snapshot parts (`snapshot-primitives`, `snapshot-semantic`, `snapshot-component`, `snapshot-styles`) with `use_figma` read-only. Save each result as a JSON file in `out/`.
4. `node design-system/figma/sync.ts verify out/snapshot-*.json` compares them with the payload. It exits non-zero on any mismatch and lists variables that exist only in Figma as extras.

Figma returns at most 20 KB per call, which is why the snapshot is split. `send_code_to_figma` is not used. It imports runnable code layers, which is a different artifact from tokens and components.

## Status

Checked items are done and covered by a test or a run. Open items are the work that remains.

### Done

- [x] Token source, schema, build, and resolved output. A broken or circular reference is rejected by a test.
- [x] Contrast tests on resolved values for every approved pairing, plus the hover, pressed, error, and selected states.
- [x] Raw-value rules: no hex, no arbitrary bracketed values, no undefined color classes. ESLint and the unit tests both check this.
- [x] Light theme only.
- [x] Sora 800 for brand headings, Inter for UI text. Heading rejects the brand face below level 2.
- [x] Status palette, interactive blue `#0066CC`, and the focus outline.
- [x] Five button variants with hover and pressed states.
- [x] Control states: Checkbox error style matches Input, Input hover uses `border.interactive`.
- [x] Primitives with keyboard and touch tests: Modal, Drawer, Toast, Table, Tabs, Toggle, Pagination, Tooltip, the combobox, and the passenger selector.
- [x] Contracts for the thirteen primitives with variant props.
- [x] Storybook with stories for the primitives and airline patterns. Telemetry is off.
- [x] Story-level axe scan for every story, and screenshot baselines for every story and interactive state.
- [x] Airline patterns: airport combobox, flight search panel, fare card, booking stepper with error state, passenger selector, boarding pass, and flight status panel.
- [x] Native date field kept on search. The custom calendar is deferred.
- [x] Site-wide migration of every page, the header, the footer, and the mobile menu.
- [x] Font payload recorded: Inter 48.0 KB, Sora 15.3 KB.
- [x] Visual regression for five pages at four widths, and 200% zoom and long-label checks.
- [x] Lighthouse on home and search, mobile and desktop.
- [x] `pnpm run check` runs the whole local gate.