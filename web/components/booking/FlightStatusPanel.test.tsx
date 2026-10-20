// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FlightStatusPanel } from "./FlightStatusPanel";
import { FLIGHT_STATUS } from "@/lib/flightStatus";

afterEach(cleanup);

describe("FlightStatusPanel", () => {
  it("shows the status as text, not only as colour", () => {
    render(<FlightStatusPanel legs={[{ flight_number: "UA101", status: "delayed" }]} />);
    const list = screen.getByRole("list", { name: "Flight status" });
    expect(within(list).getByText("UA101")).toBeTruthy();
    expect(within(list).getByText("Delayed")).toBeTruthy();
  });

  it("says when a status is loading or could not be loaded", () => {
    render(
      <FlightStatusPanel
        legs={[
          { flight_number: "UA101", status: undefined },
          { flight_number: "UA202", status: null },
        ]}
      />,
    );
    expect(screen.getByText("Checking status…")).toBeTruthy();
    expect(screen.getByText("Status unavailable")).toBeTruthy();
  });

  it("defines all nine statuses the API can return", () => {
    expect(Object.keys(FLIGHT_STATUS).sort()).toEqual(
      ["arrived", "boarding", "cancelled", "delayed", "departed", "diverted", "landed", "on_time", "scheduled"],
    );
    expect(Object.values(FLIGHT_STATUS).map((s) => s.label)).toEqual(
      ["On Time", "Delayed", "Boarding", "Cancelled", "Scheduled", "Departed", "Diverted", "Landed", "Arrived"],
    );
  });
});
