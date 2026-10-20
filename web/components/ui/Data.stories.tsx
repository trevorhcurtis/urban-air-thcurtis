import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Badge } from "./Badge";
import { Pagination } from "./Pagination";
import { type Column, Table } from "./Table";
import { Tabs } from "./Tabs";
import type { SortState } from "./SortBar";
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
  { key: "status", header: "Status", sortable: true, cell: (r) => <Badge tone={r.status === "Delayed" ? "warning" : "success"}>{r.status}</Badge> },
];

const meta = {
  title: "Primitives/Data and navigation",
  component: Table,
  args: { caption: "Flights", columns: COLUMNS, rows: ROWS, rowKey: (r: Row) => r.id, sort: { key: "flight", dir: "asc" }, onSortChange: () => {} },
} satisfies Meta<typeof Table<Row>>;

export default meta;

export const SortableTable: StoryObj = {
  render: function TableStory() {
    const [sort, setSort] = useState<SortState>({ key: "flight", dir: "asc" });
    const rows = sortItems(ROWS, sort, { flight: (r) => r.flight, price: (r) => r.price, status: (r) => r.status });
    return <Table caption="Flights" columns={COLUMNS} rows={rows} rowKey={(r) => r.id} sort={sort} onSortChange={setSort} />;
  },
};

export const TabsPanel: StoryObj = {
  render: () => (
    <Tabs
      label="Profile sections"
      tabs={[
        { id: "trips", label: "Trips", content: <p className="text-text-primary">Upcoming and past trips.</p> },
        { id: "rewards", label: "Rewards", content: <p className="text-text-primary">Points and tier progress.</p> },
        { id: "details", label: "Details", content: <p className="text-text-primary">Name, email, and phone.</p> },
      ]}
    />
  ),
};

export const PaginationControls: StoryObj = {
  render: function PaginationStory() {
    const [page, setPage] = useState(1);
    return <Pagination page={page} pageCount={4} onPageChange={setPage} label="Search results pages" />;
  },
};
