// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";
import { StepIssuesProvider, useStepIssue } from "./StepIssues";
import { AirportCombobox, type AirportOption } from "./AirportCombobox";
import { PassengerSelector } from "./PassengerSelector";
import { FlightSearchPanel } from "./FlightSearchPanel";
import { baggageLines, FareCard } from "./FareCard";
import type { Search } from "@/lib/session/types";

// The stepper reads the current path. Pin it to the seats step for these tests.
vi.mock("next/navigation", () => ({ usePathname: () => "/book/seats" }));

afterEach(cleanup);

const AIRPORTS: AirportOption[] = [
  { code: "DFW", city: "Dallas", name: "Dallas Fort Worth International" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International" },
  { code: "ORD", city: "Chicago", name: "O'Hare International" },
];

function Harness({ initial = "DFW", onChange = () => {} }: { initial?: string; onChange?: (code: string) => void }) {
  return (
    <AirportCombobox id="origin" label="From" value={initial} options={AIRPORTS} onChange={(code) => onChange(code)} />
  );
}

describe("AirportCombobox", () => {
  it("shows the chosen airport and names itself as a combobox", () => {
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "From" }) as HTMLInputElement;
    expect(input.value).toBe("Dallas (DFW)");
  });

  it("filters by city, code, or airport name while typing", () => {
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "chi" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Chicago")]));
    expect(screen.queryByText(/Dallas \(DFW\)/)).toBeNull();
  });

  it("moves through results with the arrow keys and chooses with Enter", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toContain("ORD");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("ORD");
  });

  it("closes on Escape and jumps with Home and End", () => {
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "End" });
    expect(input.getAttribute("aria-activedescendant")).toContain("ORD");
    fireEvent.keyDown(input, { key: "Home" });
    expect(input.getAttribute("aria-activedescendant")).toContain("DFW");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("chooses an option on tap", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.mouseDown(screen.getByRole("option", { name: /Los Angeles/ }));
    expect(onChange).toHaveBeenCalledWith("LAX");
  });
});

describe("PassengerSelector", () => {
  it("stops at 1 and 9 so the count can't leave the allowed range", () => {
    const onChange = vi.fn();
    const { rerender } = render(<PassengerSelector value={1} onChange={onChange} />);
    expect((screen.getByRole("button", { name: "Fewer passengers" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "More passengers" }));
    expect(onChange).toHaveBeenLastCalledWith(2);

    rerender(<PassengerSelector value={9} onChange={onChange} />);
    expect((screen.getByRole("button", { name: "More passengers" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("offers a dropdown of 1 through 9 passengers and reports the chosen count", () => {
    const onChange = vi.fn();
    render(<PassengerSelector value={3} onChange={onChange} />);
    const select = screen.getByRole("combobox", { name: "Number of passengers" }) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    expect(select.value).toBe("3");
    fireEvent.change(select, { target: { value: "7" } });
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it("does not submit an enclosing form when a stepper button is pressed", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PassengerSelector value={2} onChange={() => {}} />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "More passengers" }));
    fireEvent.click(screen.getByRole("button", { name: "Fewer passengers" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

function Reporter({ index, message }: { index: number; message: string | null }) {
  useStepIssue(index, message);
  return null;
}

describe("Stepper error state", () => {
  it("marks a reported step with the words Needs attention and the issue, and keeps aria-current", () => {
    render(
      <StepIssuesProvider>
        <Reporter index={3} message="Seat map unavailable" />
        <Stepper />
      </StepIssuesProvider>,
    );
    const seats = screen.getByText("Seats").closest("li")!;
    expect(seats.textContent).toContain("Needs attention");
    expect(seats.textContent).toContain("Seat map unavailable");
    expect(seats.getAttribute("aria-current")).toBe("step");
  });

  it("clears the error when the page stops reporting an issue", () => {
    const { rerender } = render(
      <StepIssuesProvider>
        <Reporter index={3} message="Seat map unavailable" />
        <Stepper />
      </StepIssuesProvider>,
    );
    rerender(
      <StepIssuesProvider>
        <Reporter index={3} message={null} />
        <Stepper />
      </StepIssuesProvider>,
    );
    expect(screen.getByText("Seats").closest("li")!.textContent).not.toContain("Needs attention");
  });
});

describe("FlightSearchPanel", () => {
  const form: Search = {
    origin: "DFW",
    destination: "LAX",
    trip_type: "round_trip",
    depart_date: "2026-10-20",
    return_date: "2026-10-23",
    passengers: 1,
  };

  function renderPanel(overrides: Partial<React.ComponentProps<typeof FlightSearchPanel>> = {}) {
    const props = {
      form,
      errors: {},
      origins: AIRPORTS,
      destinations: AIRPORTS,
      ready: true,
      submitting: false,
      minDate: "2026-10-16",
      maxDate: "2026-11-14",
      onChange: vi.fn(),
      onSwap: vi.fn(),
      onSubmit: vi.fn(),
      ...overrides,
    };
    render(<FlightSearchPanel {...props} />);
    return props;
  }

  it("is a labelled form with the route, dates, passengers, and submit control", () => {
    renderPanel();
    expect(screen.getByRole("form", { name: "Flight search" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "From" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "To" })).toBeTruthy();
    expect(screen.getByLabelText(/Return date/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show flights" })).toBeTruthy();
  });

  it("reports a trip type change and hides the return date for one-way", () => {
    const { onChange } = renderPanel();
    fireEvent.click(screen.getByText("One-way", { exact: true }));
    expect(onChange).toHaveBeenCalledWith("trip_type", "one_way");
  });

  it("hides the return date when the trip is one-way", () => {
    renderPanel({ form: { ...form, trip_type: "one_way" } });
    expect(screen.queryByLabelText(/Return date/)).toBeNull();
  });

  it("reports a swap of origin and destination", () => {
    const { onSwap } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Swap airports" }));
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("does not submit the search form when swapping airports", () => {
    const { onSubmit } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Swap airports" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps submit disabled until airports and routes have loaded", () => {
    renderPanel({ ready: false });
    const button = screen.getByRole("button", { name: "Loading airports…" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("reports passenger count changes", () => {
    const { onChange } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "More passengers" }));
    expect(onChange).toHaveBeenCalledWith("passengers", 2);
  });
});

describe("FareCard", () => {
  const ECONOMY = {
    code: "ECONOMY",
    label: "Economy",
    price_cents: 18900,
    seats_open: 12,
    baggage: { carry_on: 1, checked_included: 0, checked_fee_available: true },
    restrictions: [
      { label: "Changes", value: "Allowed for a fee" },
      { label: "Cancellation", value: "Non-refundable" },
      { label: "Seat selection", value: "Fee applies" },
    ],
  };

  it("describes baggage in plain language", () => {
    expect(baggageLines(ECONOMY.baggage)).toEqual([
      "1 carry-on bag included",
      "No checked bags included",
      "Checked bags available for a fee",
    ]);
    expect(baggageLines({ carry_on: 2, checked_included: 2, checked_fee_available: true })).toContain("2 checked bags included");
  });

  it("is a labelled radio choice that reports selection", () => {
    const onChange = vi.fn();
    render(<FareCard name="class-1" option={ECONOMY} checked={false} onChange={onChange} tooltip="Economy" />);
    const radio = screen.getByRole("radio", { name: /Economy/ });
    fireEvent.click(radio);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("lists the baggage allowance inside the card", () => {
    render(<FareCard name="class-1" option={ECONOMY} checked={false} onChange={() => {}} tooltip="Economy" />);
    expect(screen.getByRole("list", { name: "Baggage for Economy" }).textContent).toContain("1 carry-on bag included");
  });

  it("keeps fare restrictions hidden until the baggage info is hovered, focused, or tapped", () => {
    render(<FareCard name="class-1" option={ECONOMY} checked={false} onChange={() => {}} tooltip="Economy" />);
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.focus(screen.getByText("Fare restrictions"));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.textContent).toContain("Cancellation: Non-refundable");
    expect(tooltip.textContent).toContain("Seat selection: Fee applies");
  });

  it("does not select the class when the restrictions are tapped", () => {
    const onChange = vi.fn();
    render(<FareCard name="class-1" option={ECONOMY} checked={false} onChange={onChange} tooltip="Economy" />);
    fireEvent.click(screen.getByText("Fare restrictions"));
    expect((screen.getByRole("radio", { name: /Economy/ }) as HTMLInputElement).checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });
});
