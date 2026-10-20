"use client";

import { useState } from "react";
import { AirportCombobox } from "@/components/booking/AirportCombobox";
import { PassengerSelector } from "@/components/booking/PassengerSelector";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heading } from "@/components/ui/Heading";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Progress } from "@/components/ui/Progress";
import type { SortState } from "@/components/ui/SortBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { type Column, Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { sortItems } from "@/lib/sort";

type Row = { id: string; flight: string; price: number; status: string };

const ROWS: Row[] = [
  { id: "1", flight: "UA104", price: 320, status: "On time" },
  { id: "2", flight: "UA101", price: 189, status: "Boarding" },
  { id: "3", flight: "UA112", price: 245, status: "Delayed" },
];

const COLUMNS: Column<Row>[] = [
  { key: "flight", header: "Flight", sortable: true, cell: (r) => r.flight },
  { key: "price", header: "Price", sortable: true, cell: (r) => `$${r.price}` },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (r) => <Badge tone={r.status === "Delayed" ? "warning" : "success"}>{r.status}</Badge>,
  },
];

const AIRPORTS = [
  { code: "DFW", city: "Dallas", name: "Dallas Fort Worth International" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International" },
  { code: "ORD", city: "Chicago", name: "O'Hare International" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International" },
];

/** Interactive examples for components that need client state. Development only, like the rest of the styleguide. */
export function Demos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(true);
  const [sort, setSort] = useState<SortState>({ key: "flight", dir: "asc" });
  const [airport, setAirport] = useState("DFW");
  const [passengers, setPassengers] = useState(2);
  const [page, setPage] = useState(1);
  const [notify, setNotify] = useState(true);
  const rows = sortItems(ROWS, sort, { flight: (r) => r.flight, price: (r) => r.price, status: (r) => r.status });

  return (
    <>
      <section className="space-y-3" aria-labelledby="sg-modal">
        <Heading level={2} size={4} id="sg-modal">Modal</Heading>
        <Button variant="destructive" onClick={() => setModalOpen(true)}>Cancel booking</Button>
        <Modal open={modalOpen} title="Cancel this booking?" onClose={() => setModalOpen(false)}>
          <p className="text-sm text-text-primary">Esc, a tap on the backdrop, or a button closes this dialog.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Keep booking</Button>
            <Button variant="destructive" onClick={() => setModalOpen(false)}>Cancel booking</Button>
          </div>
        </Modal>
      </section>

      <section className="space-y-3" aria-labelledby="sg-toast">
        <Heading level={2} size={4} id="sg-toast">Toast</Heading>
        {toastOpen ? (
          <Toast tone="warning" title="Fare changed since your search" autoDismissMs={8000} onDismiss={() => setToastOpen(false)}>
            Check your fare before you pay.
          </Toast>
        ) : (
          <Button variant="secondary" onClick={() => setToastOpen(true)}>Show toast again</Button>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="sg-table">
        <Heading level={2} size={4} id="sg-table">Table</Heading>
        <Table caption="Flights" columns={COLUMNS} rows={rows} rowKey={(r) => r.id} sort={sort} onSortChange={setSort} />
      </section>

      <section className="space-y-3" aria-labelledby="sg-tabs">
        <Heading level={2} size={4} id="sg-tabs">Tabs</Heading>
        <Tabs
          label="Profile sections"
          tabs={[
            { id: "trips", label: "Trips", content: <p className="text-text-primary">Upcoming and past trips.</p> },
            { id: "rewards", label: "Rewards", content: <p className="text-text-primary">Points and tier progress.</p> },
            { id: "details", label: "Details", content: <p className="text-text-primary">Name, email, and phone.</p> },
          ]}
        />
      </section>

      <section className="space-y-3" aria-labelledby="sg-search">
        <Heading level={2} size={4} id="sg-search">Airport combobox and passengers</Heading>
        <div className="grid gap-5 sm:grid-cols-2">
          <AirportCombobox id="sg-airport" label="From" value={airport} options={AIRPORTS} onChange={setAirport} />
          <PassengerSelector value={passengers} onChange={setPassengers} />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="sg-toggle">
        <Heading level={2} size={4} id="sg-toggle">Toggle and pagination</Heading>
        <Toggle checked={notify} onChange={setNotify}>Email me flight updates</Toggle>
        <Pagination page={page} pageCount={4} onPageChange={setPage} label="Search results pages" />
      </section>

      <section className="space-y-3" aria-labelledby="sg-progress">
        <Heading level={2} size={4} id="sg-progress">Progress, avatar, and loading</Heading>
        <Progress label="Profile complete" value={60} />
        <Progress label="Loading flights" />
        <div className="flex items-center gap-3">
          <Avatar name="Alex Traveler" />
          <Avatar name="Jordan Rivera" size="lg" />
        </div>
        <Spinner label="Finding flights" />
        <Skeleton className="h-4 w-2/3" />
      </section>

      <section className="space-y-3" aria-labelledby="sg-empty">
        <Heading level={2} size={4} id="sg-empty">Empty state and card</Heading>
        <EmptyState title="No trips yet" action={<Button variant="soft">Find a flight</Button>}>
          Trips you book appear here for 24 hours in this browser.
        </EmptyState>
        <Card>
          <Badge tone="info">Preview</Badge>
        </Card>
      </section>
    </>
  );
}
