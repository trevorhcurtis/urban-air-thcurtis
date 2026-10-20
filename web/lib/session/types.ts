/** Shapes stored in the signed session and trip cookies. Nothing here is stored server-side. */

export type TripType = "round_trip" | "one_way";

export type Search = {
  origin: string;
  destination: string;
  trip_type: TripType;
  depart_date: string;
  return_date: string | null;
  passengers: number;
};

export type Leg = {
  flight_id: number;
  flight_number: string;
  class: string;
  class_label: string;
  price_cents: number;
  origin: string;
  destination: string;
  flight_date: string;
  depart_time: string;
  arrive_time: string;
};

export type Passenger = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  special_assistance: string;
  email: string;
  phone: string;
  terms_accepted: boolean;
};

export type Session = {
  search: Search | null;
  outbound: Leg | null;
  return: Leg | null;
  passengers: Passenger[];
  /** Seat codes such as "12A", one per passenger, per leg. */
  seats: { outbound: string[]; return: string[] };
};

export type Trip = {
  confirmation_code: string;
  created_at: string;
  search: Search;
  legs: Leg[];
  passengers: Pick<Passenger, "first_name" | "last_name">[];
  seats: { outbound: string[]; return: string[] };
  base_fare_cents: number;
  taxes_cents: number;
  fees_cents: number;
  total_cents: number;
};

/** Contact details the traveler saves on their profile. Kept in its own cookie, not the booking session. */
export type ProfileDetails = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};
