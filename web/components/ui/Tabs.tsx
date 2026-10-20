"use client";

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

export type TabItem = { id: string; label: string; content: ReactNode };

/**
 * WAI-ARIA tabs. Arrow keys, Home, and End move between tabs and select them. Only the selected
 * tab is in the tab order. Taps select a tab directly.
 */
export function Tabs({ label, tabs, defaultId }: { label: string; tabs: TabItem[]; defaultId?: string }) {
  const [selected, setSelected] = useState(defaultId ?? tabs[0]?.id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const baseId = useId();

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = tabs[next];
    setSelected(tab.id);
    refs.current[tab.id]?.focus();
  }

  const active = tabs.find((t) => t.id === selected) ?? tabs[0];

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border-subtle">
        {tabs.map((tab, index) => {
          const isSelected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-${tab.id}-tab`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-${tab.id}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(tab.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold ${
                isSelected ? "border-border-interactive text-text-link" : "border-transparent text-text-primary hover:bg-surface-brand"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-${active.id}-panel`} aria-labelledby={`${baseId}-${active.id}-tab`} className="pt-6">
        {active.content}
      </div>
    </div>
  );
}
