"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { money } from "@/lib/format";

export type Baggage = { carry_on: number; checked_included: number; checked_fee_available: boolean };

export type Restriction = { label: string; value: string };

export type FareOption = {
  code: string;
  label: string;
  price_cents: number;
  seats_open: number;
  baggage: Baggage;
  restrictions: Restriction[];
};

/**
 * One fare class on a flight. It is a radio choice with its name, price, seats left, and baggage
 * allowance. The whole tile is the target, so a tap anywhere on it selects the class.
 */
export function FareCard({
  name,
  option,
  checked,
  onChange,
  tooltip,
}: {
  name: string;
  option: FareOption;
  checked: boolean;
  onChange: () => void;
  tooltip: string;
}) {
  return (
    <label
      className={`flex min-h-control-md cursor-pointer flex-col gap-2 rounded-md border bg-surface-canvas px-3 py-2 text-sm ${
        checked ? "border-border-interactive" : "border-border-default"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <input type="radio" name={name} value={option.code} checked={checked} onChange={onChange} className="h-5 w-5 accent-surface-interactive" />
          <Tooltip content={tooltip}>{option.label}</Tooltip>
        </span>
        <span className="text-right">
          <span className="block font-semibold text-text-primary">{money(option.price_cents)}</span>
          <span className="block text-xs text-text-muted">{option.seats_open} left</span>
        </span>
      </span>
      <ul aria-label={`Baggage for ${option.label}`} className="space-y-0.5 pl-7 text-xs text-text-secondary">
        {baggageLines(option.baggage).map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>
          {/* The card is a label, so a click here would also select the class. Cancel that; the tooltip still opens. */}
          <span onClick={(e) => e.preventDefault()}>
            <Tooltip content={<RestrictionList restrictions={option.restrictions} />}>Fare restrictions</Tooltip>
          </span>
        </li>
      </ul>
    </label>
  );
}

/** Tooltip body. Spans, not a table, because the tooltip sits inside inline content. */
function RestrictionList({ restrictions }: { restrictions: Restriction[] }) {
  return (
    <>
      {restrictions.map((r) => (
        <span key={r.label} className="block">
          <span className="font-semibold">{r.label}:</span> {r.value}
        </span>
      ))}
    </>
  );
}

/** Plain-language baggage lines. Checked-bag fees are shown but not added to the fare total. */
export function baggageLines(b: Baggage): string[] {
  const carry = `${b.carry_on} carry-on ${b.carry_on === 1 ? "bag" : "bags"} included`;
  const checked =
    b.checked_included > 0
      ? `${b.checked_included} checked ${b.checked_included === 1 ? "bag" : "bags"} included`
      : "No checked bags included";
  return b.checked_fee_available ? [carry, checked, "Checked bags available for a fee"] : [carry, checked];
}
