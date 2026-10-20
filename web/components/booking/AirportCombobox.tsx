"use client";

import { type KeyboardEvent, useId, useMemo, useState } from "react";

export type AirportOption = { code: string; city: string; name: string };

const labelFor = (a: AirportOption) => `${a.city} (${a.code})`;

/**
 * Searchable airport picker following the WAI-ARIA combobox pattern. Typing filters by city, code,
 * or airport name. Arrow keys move through results, Enter chooses, Escape closes, and Home and End
 * jump to the first and last result. A tap chooses a result directly.
 */
export function AirportCombobox({
  id,
  label,
  value,
  options,
  onChange,
  error,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  options: AirportOption[];
  onChange: (code: string) => void;
  error?: string;
  required?: boolean;
}) {
  const listId = useId();
  const selected = options.find((a) => a.code === value);
  const [query, setQuery] = useState<string | null>(null); // null means "show the chosen airport"
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const shown = useMemo(() => {
    if (!query) return options;
    const q = query.trim().toLowerCase();
    return options.filter((a) => `${a.city} ${a.code} ${a.name}`.toLowerCase().includes(q));
  }, [options, query]);

  const activeIndex = Math.min(active, Math.max(shown.length - 1, 0));
  const activeOption = shown[activeIndex];
  const describedBy = error ? `${id}-error` : undefined;

  function choose(airport: AirportOption) {
    onChange(airport.code);
    setQuery(null);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End" && open) {
      event.preventDefault();
      setActive(shown.length - 1);
    } else if (event.key === "Enter" && open && activeOption) {
      event.preventDefault();
      choose(activeOption);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery(null);
    }
  }

  // Options choose on mousedown, not click. The input's blur would otherwise close the list first.
  return (
    <div className="relative flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-text-error" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        role="combobox"
        type="text"
        autoComplete="off"
        required={required}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeOption ? `${listId}-${activeOption.code}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        value={query ?? (selected ? labelFor(selected) : "")}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setOpen(false);
          setQuery(null);
        }}
        onKeyDown={onKeyDown}
        className={`mt-1 block min-h-control-lg w-full rounded-md border bg-surface-canvas px-3 py-2.5 text-md text-text-primary placeholder:text-text-muted ${
          error ? "border-solid-error" : "border-border-default"
        }`}
      />
      {open && shown.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute top-full z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border-default bg-surface-canvas py-1 shadow-popover"
        >
          {shown.map((airport, index) => (
            <li
              key={airport.code}
              id={`${listId}-${airport.code}`}
              role="option"
              aria-selected={airport.code === value}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(airport);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex min-h-11 cursor-pointer flex-col justify-center px-3 py-1.5 text-sm ${
                index === activeIndex ? "bg-surface-brand text-text-primary" : "text-text-primary"
              }`}
            >
              <span className="font-semibold">{labelFor(airport)}</span>
              <span className="text-xs text-text-muted">{airport.name}</span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-text-error">
          {error}
        </p>
      )}
    </div>
  );
}
