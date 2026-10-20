import type { BadgeTone } from "@/components/ui/Badge";

/** Flight status codes from the API (FlightStatus in api/src/Domain). */
export type FlightStatusCode =
  | "on_time"
  | "delayed"
  | "boarding"
  | "cancelled"
  | "scheduled"
  | "departed"
  | "diverted"
  | "landed"
  | "arrived";

export const FLIGHT_STATUS: Record<FlightStatusCode, { label: string; tone: BadgeTone }> = {
  on_time: { label: "On Time", tone: "success" },
  delayed: { label: "Delayed", tone: "warning" },
  boarding: { label: "Boarding", tone: "info" },
  cancelled: { label: "Cancelled", tone: "error" },
  scheduled: { label: "Scheduled", tone: "info" },
  departed: { label: "Departed", tone: "neutral" },
  diverted: { label: "Diverted", tone: "warning" },
  landed: { label: "Landed", tone: "neutral" },
  arrived: { label: "Arrived", tone: "neutral" },
};
