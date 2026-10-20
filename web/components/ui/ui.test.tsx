// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Badge } from "./Badge";
import { Modal } from "./Modal";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { Table, type Column } from "./Table";
import { Toast } from "./Toast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(<Modal open={false} title="Cancel trip" onClose={() => {}}><button>Yes</button></Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("names the dialog and moves focus inside it on open", () => {
    render(<Modal open title="Cancel trip" onClose={() => {}}><button>Keep trip</button><button>Cancel trip</button></Modal>);
    expect(screen.getByRole("dialog", { name: "Cancel trip" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Keep trip" }));
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<Modal open title="Cancel trip" onClose={onClose}><button>Keep trip</button></Modal>);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps Tab from the last control to the first, and Shift+Tab back", () => {
    render(<Modal open title="Cancel trip" onClose={() => {}}><button>First</button><button>Last</button></Modal>);
    const dialog = screen.getByRole("dialog");
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("returns focus to the element that opened it", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<Modal open title="Cancel trip" onClose={() => {}}><button>Keep trip</button></Modal>);
    rerender(<Modal open={false} title="Cancel trip" onClose={() => {}}><button>Keep trip</button></Modal>);

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("closes on a tap or click on the backdrop, but not on a click inside the panel", () => {
    const onClose = vi.fn();
    render(<Modal open title="Cancel trip" onClose={onClose}><button>Keep trip</button></Modal>);

    fireEvent.click(screen.getByRole("button", { name: "Keep trip" }));
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = screen.getByRole("dialog").parentElement!.firstElementChild!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Table", () => {
  type Flight = { id: string; flight: string; price: number };
  const rows: Flight[] = [
    { id: "a", flight: "UA101", price: 200 },
    { id: "b", flight: "UA102", price: 150 },
  ];
  const columns: Column<Flight>[] = [
    { key: "flight", header: "Flight", sortable: true, cell: (r) => r.flight },
    { key: "price", header: "Price", sortable: true, cell: (r) => `$${r.price}` },
    { key: "id", header: "Ref", cell: (r) => r.id },
  ];

  it("marks the active sort column with aria-sort and leaves others as none", () => {
    render(<Table caption="Flights" columns={columns} rows={rows} rowKey={(r) => r.id} sort={{ key: "flight", dir: "asc" }} onSortChange={() => {}} />);
    const table = screen.getByRole("table", { name: "Flights" });
    expect(within(table).getByRole("columnheader", { name: /Flight/ }).getAttribute("aria-sort")).toBe("ascending");
    expect(within(table).getByRole("columnheader", { name: /Price/ }).getAttribute("aria-sort")).toBe("none");
    expect(within(table).getByRole("columnheader", { name: "Ref" }).hasAttribute("aria-sort")).toBe(false);
  });

  it("sorts a new column ascending on activation, then flips direction when the active column is activated again", () => {
    const onSortChange = vi.fn();
    render(<Table caption="Flights" columns={columns} rows={rows} rowKey={(r) => r.id} sort={{ key: "flight", dir: "asc" }} onSortChange={onSortChange} />);
    const table = screen.getByRole("table", { name: "Flights" });

    fireEvent.click(within(table).getByRole("button", { name: /Price/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "price", dir: "asc" });

    fireEvent.click(within(table).getByRole("button", { name: /Flight/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "flight", dir: "desc" });
  });

  it("keeps sort buttons as focusable native buttons", () => {
    render(<Table caption="Flights" columns={columns} rows={rows} rowKey={(r) => r.id} sort={{ key: "flight", dir: "asc" }} onSortChange={() => {}} />);
    const button = within(screen.getByRole("table", { name: "Flights" })).getByRole("button", { name: /Price/ });
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("renders the stacked mobile list with a labeled value for each column", () => {
    render(<Table caption="Flights" columns={columns} rows={rows} rowKey={(r) => r.id} sort={{ key: "flight", dir: "asc" }} onSortChange={() => {}} />);
    const list = screen.getByRole("list", { name: "Flights" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Price").nextElementSibling?.textContent).toBe("$200");
  });
});

describe("Toast", () => {
  it("announces errors as alerts and other tones as status", () => {
    const { unmount } = render(<Toast tone="error" title="Payment busy" onDismiss={() => {}} />);
    expect(screen.getByRole("alert").textContent).toContain("Payment busy");
    unmount();

    render(<Toast tone="info" title="Fare updated" onDismiss={() => {}} />);
    expect(screen.getByRole("status").textContent).toContain("Fare updated");
  });

  it("calls onDismiss from its dismiss button", () => {
    const onDismiss = vi.fn();
    render(<Toast title="Fare updated" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss: Fare updated" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses itself after autoDismissMs", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast title="Saved" autoDismissMs={3000} onDismiss={onDismiss} />);
    vi.advanceTimersByTime(2999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("Spinner, Skeleton, Badge", () => {
  it("announces the spinner label as a status", () => {
    render(<Spinner label="Finding flights" />);
    expect(screen.getByRole("status").textContent).toContain("Finding flights");
  });

  it("hides the skeleton from assistive technology", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the badge label as text", () => {
    render(<Badge tone="success">Confirmed</Badge>);
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });
});
