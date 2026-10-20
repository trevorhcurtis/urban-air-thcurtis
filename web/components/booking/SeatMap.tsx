"use client";

import { type KeyboardEvent, useState } from "react";

export type SeatLayout = {
  key: string;
  cabins: { class: string; firstRow: number; lastRow: number; pattern: string }[];
  exit_rows: number[];
  bulkhead_rows: number[];
  blocked_rows: { number: number; label: string }[];
};

export type SeatData = { row: number; col: string; class: string; status: "open" | "taken"; features: string[] };

export type FeatureMap = Record<string, { code: string; label: string; description: string }>;

type SeatState = "open" | "mine" | "taken" | "other-class" | "missing";

/**
 * Renders a cabin from the layout. Open seats in the fare class can be picked. Taken seats and
 * other cabins are disabled. Seat features appear in the detail panel on hover, focus, or tap.
 * A list view shows the same seats as buttons for small screens and screen readers.
 */
export function SeatMap({
  layout,
  seats,
  features,
  fareClass,
  assigned,
  activePassenger,
  onPick,
  nameFor,
}: {
  layout: SeatLayout;
  seats: SeatData[];
  features: FeatureMap;
  fareClass: string;
  /** seat code for each passenger index, "" if unassigned */
  assigned: string[];
  activePassenger: number;
  onPick: (code: string) => void;
  nameFor: (index: number) => string;
}) {
  const [focused, setFocused] = useState<SeatData | null>(null);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const byKey = new Map(seats.map((s) => [`${s.row}${s.col}`, s]));
  const takenByPassenger = new Map(assigned.map((code, i) => [code, i]));
  const maxRow = Math.max(...layout.cabins.map((c) => c.lastRow));
  const blocked = new Map(layout.blocked_rows.map((b) => [b.number, b.label]));

  // Roving tabindex: one seat in the map is in the tab order, and arrow keys move between seats.
  const firstSelectable = seats.find((s) => s.class === fareClass && s.status === "open") ?? null;
  const firstSelectableRow = firstSelectable?.row ?? -1;
  const firstSelectableCol = firstSelectable?.col ?? "";

  const seatState = (code: string, seat: SeatData | undefined) => stateFor(seat, takenByPassenger.get(code), fareClass);

  const rows = [];
  for (let row = 1; row <= maxRow; row++) {
    if (blocked.has(row)) {
      rows.push(
        <div key={row} className="col-span-full py-2 text-center text-xs uppercase tracking-wide text-text-muted" aria-hidden="true">
          {blocked.get(row)}
        </div>,
      );
      continue;
    }
    const cabin = layout.cabins.find((c) => row >= c.firstRow && row <= c.lastRow);
    if (!cabin) continue;

    const cells = cabin.pattern.split("").map((ch, col) => {
      if (ch === "_") return <div key={`${row}-aisle-${col}`} aria-hidden="true" className="w-4" />;
      const code = `${row}${ch}`;
      const seat = byKey.get(code);
      const owner = takenByPassenger.get(code);
      const isExit = layout.exit_rows.includes(row);
      const state = seatState(code, seat);
      const disabled = state === "missing" || state === "taken" || state === "other-class";

      return (
        <button
          key={code}
          type="button"
          data-seat={code}
          tabIndex={focusedCode === code || (focusedCode === null && row === firstSelectableRow && ch === firstSelectableCol) ? 0 : -1}
          disabled={disabled}
          aria-label={seatLabel(code, state, seat, owner, nameFor, features)}
          aria-pressed={state === "mine"}
          onFocus={() => {
            setFocusedCode(code);
            if (seat) setFocused(seat);
          }}
          onMouseEnter={() => seat && setFocused(seat)}
          onClick={() => {
            if (seat) setFocused(seat);
            if (state === "open" || state === "mine") onPick(code);
          }}
          className={`relative flex h-11 w-11 items-center justify-center rounded-t-md text-xs font-semibold transition-colors ${seatClass(state)}`}
        >
          {state === "mine" ? owner! + 1 : ch}
          {isExit && <span className="sr-only"> exit row</span>}
        </button>
      );
    });

    rows.push(
      <div key={row} className="col-span-full flex items-center gap-2">
        <span className="w-7 text-right text-xs text-text-muted" aria-hidden="true">{row}</span>
        <div className="flex gap-1.5">{cells}</div>
        {layout.exit_rows.includes(row) && <span className="ml-1 rounded bg-surface-warning/20 px-1.5 text-xs font-semibold text-text-primary">EXIT</span>}
      </div>,
    );
  }

  // List view covers the seats in the traveler's fare class, in row order.
  const listSeats: { code: string; seat: SeatData; state: SeatState; owner: number | undefined }[] = [];
  for (let row = 1; row <= maxRow; row++) {
    const cabin = layout.cabins.find((c) => row >= c.firstRow && row <= c.lastRow);
    if (blocked.has(row) || !cabin) continue;
    for (const ch of cabin.pattern) {
      if (ch === "_") continue;
      const code = `${row}${ch}`;
      const seat = byKey.get(code);
      if (!seat || seat.class !== fareClass) continue;
      listSeats.push({ code, seat, state: seatState(code, seat), owner: takenByPassenger.get(code) });
    }
  }

  const cabinLabels = layout.cabins.map((c) => c.class);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-text-primary" aria-label="Legend">
          <LegendSwatch className="bg-surface-canvas border border-border-subtle" label="Open" />
          <LegendSwatch className="bg-surface-interactive" label="Your seat" />
          <LegendSwatch className="bg-border-subtle" label="Taken" />
          {cabinLabels.length > 1 && <LegendSwatch className="bg-surface-brand border border-dashed border-border-subtle" label="Other cabin" />}
        </div>
        <div role="group" aria-label="Seat view" className="inline-flex rounded-full border border-border-subtle p-1 text-sm">
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-control-md rounded-full px-4 font-medium ${view === v ? "bg-surface-interactive text-text-inverse" : "text-text-primary"}`}
            >
              {v === "map" ? "Seat map" : "List view"}
            </button>
          ))}
        </div>
      </div>

      {view === "map" ? (
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-brand/40 p-4">
          <div
            className="mx-auto grid w-max gap-2"
            role="group"
            aria-label={`Seat map, passenger ${activePassenger + 1} selected`}
            onKeyDown={moveFocus}
          >
            {rows}
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label={`Seats in ${fareClass.toLowerCase()} class, passenger ${activePassenger + 1} selected`}>
          {listSeats.map(({ code, seat, state, owner }) => (
            <li key={code}>
              <button
                type="button"
                data-list-seat={code}
                disabled={state === "taken"}
                aria-label={seatLabel(code, state, seat, owner, nameFor, features)}
                aria-pressed={state === "mine"}
                onFocus={() => setFocused(seat)}
                onMouseEnter={() => setFocused(seat)}
                onClick={() => {
                  setFocused(seat);
                  if (state === "open" || state === "mine") onPick(code);
                }}
                className={`flex min-h-control-md w-full flex-col items-center justify-center rounded-md px-1 py-2 text-xs font-semibold ${seatClass(state)}`}
              >
                <span>{state === "mine" ? `${code} · ${nameFor(owner!)}` : code}</span>
                {seat.features.length > 0 && state !== "mine" && (
                  <span className="mt-0.5 font-normal opacity-80" aria-hidden="true">
                    {seat.features.map((f) => features[f]?.label ?? f).join(", ")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-border-subtle p-4 text-sm" aria-live="polite">
        {focused ? (
          <>
            <p className="font-semibold text-text-primary">Seat {focused.row}{focused.col} · {focused.class.toLowerCase()}</p>
            <p className="mt-1 text-text-muted">
              {focused.features.length ? focused.features.map((f) => features[f]?.description ?? f).join(" ") : "Standard seat."}
            </p>
          </>
        ) : (
          <p className="text-text-muted">Hover, focus, or tap a seat to see its features.</p>
        )}
      </div>
    </div>
  );
}

function stateFor(seat: SeatData | undefined, owner: number | undefined, fareClass: string): SeatState {
  if (!seat) return "missing";
  if (owner !== undefined) return "mine";
  if (seat.status === "taken") return "taken";
  if (seat.class !== fareClass) return "other-class";
  return "open";
}

function seatLabel(
  code: string,
  state: SeatState,
  seat: SeatData | undefined,
  owner: number | undefined,
  nameFor: (index: number) => string,
  features: FeatureMap,
): string {
  switch (state) {
    case "mine": return `${code}, assigned to ${nameFor(owner!)}`;
    case "taken": return `${code}, taken`;
    case "other-class": return `${code}, not in your fare class`;
    default: return `${code}, available${seat?.features.length ? `, ${seat.features.map((f) => features[f]?.label ?? f).join(", ")}` : ""}`;
  }
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

/**
 * Moves focus to the next seat in the arrow direction, skipping aisles and seats that cannot be
 * focused. Left and right step through the row. Up and down move to the nearest row with that letter.
 */
function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  const step = ARROWS[event.key];
  if (!step) return;
  const current = (event.target as HTMLElement).closest<HTMLElement>("[data-seat]");
  if (!current) return;
  event.preventDefault();

  const code = current.dataset.seat ?? "";
  const row = Number(code.slice(0, -1));
  const letter = code.slice(-1);
  const [dRow, dCol] = step;
  const seatRow = (el: HTMLElement) => Number(el.dataset.seat!.slice(0, -1));
  const all = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-seat]"));
  const focusable = (el: HTMLElement) => !el.hasAttribute("disabled");

  let target: HTMLElement | undefined;
  if (dCol !== 0) {
    const sameRow = all.filter((el) => seatRow(el) === row);
    for (let i = sameRow.indexOf(current) + dCol; i >= 0 && i < sameRow.length; i += dCol) {
      if (focusable(sameRow[i])) {
        target = sameRow[i];
        break;
      }
    }
  } else {
    target = all
      .filter((el) => el.dataset.seat!.slice(-1) === letter && focusable(el))
      .filter((el) => (dRow < 0 ? seatRow(el) < row : seatRow(el) > row))
      .sort((a, b) => Math.abs(seatRow(a) - row) - Math.abs(seatRow(b) - row))[0];
  }

  target?.focus();
}

function seatClass(state: string): string {
  switch (state) {
    case "open": return "border border-border-default bg-surface-canvas text-text-primary hover:bg-surface-brand";
    case "mine": return "bg-surface-interactive text-text-inverse";
    case "taken": return "cursor-not-allowed bg-border-subtle text-text-inverse";
    case "other-class": return "cursor-not-allowed border border-dashed border-border-subtle bg-surface-brand text-text-muted";
    default: return "invisible";
  }
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-4 w-4 rounded ${className}`} aria-hidden="true" />
      {label}
    </span>
  );
}
