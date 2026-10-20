import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FlightStatusPanel } from "./FlightStatusPanel";
import type { FlightStatusCode } from "@/lib/flightStatus";

const meta = {
  title: "Airline patterns/Flight status panel",
  component: FlightStatusPanel,
} satisfies Meta<typeof FlightStatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const ALL: FlightStatusCode[] = ["on_time", "scheduled", "boarding", "departed", "delayed", "diverted", "landed", "arrived", "cancelled"];

export const Trip: Story = {
  args: {
    legs: [
      { flight_number: "UA101", status: "on_time" },
      { flight_number: "UA204", status: "delayed" },
    ],
  },
};

export const EveryStatus: Story = {
  args: { legs: ALL.map((status, i) => ({ flight_number: `UA${100 + i}`, status })) },
};

export const Unavailable: Story = {
  args: {
    legs: [
      { flight_number: "UA101", status: undefined },
      { flight_number: "UA204", status: null },
    ],
  },
};
