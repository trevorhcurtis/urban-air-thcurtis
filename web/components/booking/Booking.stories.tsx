import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AirportCombobox, type AirportOption } from "./AirportCombobox";
import { BoardingPass } from "./BoardingPass";
import { FlightSearchPanel } from "./FlightSearchPanel";
import { FareCard, type FareOption } from "./FareCard";
import type { Search } from "@/lib/session/types";
import { PassengerSelector } from "./PassengerSelector";

const AIRPORTS: AirportOption[] = [
  { code: "DFW", city: "Dallas", name: "Dallas Fort Worth International" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International" },
  { code: "ORD", city: "Chicago", name: "O'Hare International" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International" },
];

const meta = {
  title: "Airline patterns/Booking",
  component: AirportCombobox,
  args: { id: "origin", label: "From", value: "DFW", options: AIRPORTS, onChange: () => {} },
} satisfies Meta<typeof AirportCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Combobox: Story = {
  render: function ComboboxStory(args) {
    const [value, setValue] = useState(args.value);
    return <AirportCombobox {...args} value={value} onChange={setValue} />;
  },
};

export const ComboboxWithError: Story = { args: { error: "Choose a departure airport." } };

export const Passengers: StoryObj<typeof PassengerSelector> = {
  render: function PassengersStory() {
    const [count, setCount] = useState(2);
    return <PassengerSelector value={count} onChange={setCount} />;
  },
};

export const Boarding: StoryObj<typeof BoardingPass> = {
  render: () => (
    <BoardingPass
      direction="Outbound"
      leg={{
        flight_number: "UA104",
        flight_date: "2026-10-20",
        origin: "DFW",
        destination: "LAX",
        depart_time: "08:15",
        arrive_time: "10:02",
        class_label: "Economy",
      }}
      seats={["12A", "12B"]}
      passengers={["Alex Traveler", "Jordan Rivera"]}
    />
  ),
};

const SEARCH: Search = {
  origin: "DFW",
  destination: "LAX",
  trip_type: "round_trip",
  depart_date: "2026-10-20",
  return_date: "2026-10-23",
  passengers: 1,
};

export const FlightSearch: StoryObj<typeof FlightSearchPanel> = {
  render: function FlightSearchStory() {
    const [form, setForm] = useState<Search>(SEARCH);
    return (
      <FlightSearchPanel
        form={form}
        errors={{}}
        origins={AIRPORTS}
        destinations={AIRPORTS}
        ready
        submitting={false}
        minDate="2026-10-16"
        maxDate="2026-11-14"
        onChange={(key, value) => setForm((f) => ({ ...f, [key]: value }))}
        onSwap={() => setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }))}
        onSubmit={(e) => e?.preventDefault()}
      />
    );
  },
};

export const FlightSearchOneWay: StoryObj<typeof FlightSearchPanel> = {
  render: () => (
    <FlightSearchPanel
      form={{ ...SEARCH, trip_type: "one_way" }}
      errors={{}}
      origins={AIRPORTS}
      destinations={AIRPORTS}
      ready
      submitting={false}
      minDate="2026-10-16"
      maxDate="2026-11-14"
      onChange={() => {}}
      onSwap={() => {}}
      onSubmit={() => {}}
    />
  ),
};

export const FlightSearchWithErrors: StoryObj<typeof FlightSearchPanel> = {
  render: () => (
    <FlightSearchPanel
      form={{ ...SEARCH, origin: "LAX", destination: "LAX" }}
      errors={{ destination: "Choose a different destination from your departure airport.", depart_date: "Choose a date within the next 30 days." }}
      origins={AIRPORTS}
      destinations={AIRPORTS}
      ready
      submitting={false}
      minDate="2026-10-16"
      maxDate="2026-11-14"
      onChange={() => {}}
      onSwap={() => {}}
      onSubmit={() => {}}
    />
  ),
};

export const FareOptions: StoryObj<typeof FareCard> = {
  render: function FareOptionsStory() {
    const [selected, setSelected] = useState("ECONOMY");
    const options: FareOption[] = [
      {
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
      },
      {
        code: "PREMIUM",
        label: "Premium Economy",
        price_cents: 27900,
        seats_open: 6,
        baggage: { carry_on: 1, checked_included: 1, checked_fee_available: true },
        restrictions: [
          { label: "Changes", value: "Allowed for a fee" },
          { label: "Cancellation", value: "Partial refund" },
          { label: "Seat selection", value: "Included" },
        ],
      },
      {
        code: "BUSINESS",
        label: "Business",
        price_cents: 48900,
        seats_open: 3,
        baggage: { carry_on: 2, checked_included: 2, checked_fee_available: true },
        restrictions: [
          { label: "Changes", value: "Free before departure" },
          { label: "Cancellation", value: "Refundable, less a service fee" },
          { label: "Seat selection", value: "Included" },
        ],
      },
    ];
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <FareCard
            key={o.code}
            name="fare-stories"
            option={o}
            checked={selected === o.code}
            onChange={() => setSelected(o.code)}
            tooltip={o.label}
          />
        ))}
      </div>
    );
  },
};
