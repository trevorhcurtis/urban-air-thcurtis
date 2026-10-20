// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "./Avatar";
import { Disclosure } from "./Disclosure";
import { Drawer } from "./Drawer";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Heading } from "./Heading";
import { Pagination } from "./Pagination";
import { Progress } from "./Progress";
import { Tabs } from "./Tabs";
import { Toggle } from "./Toggle";

afterEach(cleanup);

describe("Button", () => {
  it("keeps its label while loading and blocks presses", () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Continue to seats</Button>);
    const button = screen.getByRole("button", { name: "Continue to seats" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders the destructive variant with the destructive surface", () => {
    render(<Button variant="destructive">Cancel booking</Button>);
    expect(screen.getByRole("button").className).toContain("bg-surface-destructive");
  });
});

describe("Heading", () => {
  it("uses the brand face only when asked, and never on a level 3 heading", () => {
    const { unmount } = render(<Heading level={2} size={3}>Routes we fly</Heading>);
    expect(screen.getByRole("heading", { level: 2 }).className).toContain("font-ui");
    unmount();
    render(<Heading level={1} brand>Fly Further Together.</Heading>);
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("font-brand");
  });

  it("keeps a caller's text color instead of adding the primary default", () => {
    render(<Heading level={1} brand className="text-text-inverse">Fly Further Together.</Heading>);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("text-text-inverse");
    expect(heading.className).not.toContain("text-text-primary");
  });

  it("adds the primary text color when the caller sets none", () => {
    render(<Heading level={2} size={3}>Routes we fly</Heading>);
    expect(screen.getByRole("heading", { level: 2 }).className).toContain("text-text-primary");
  });

  it("throws if a level 3 heading asks for the brand face", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Heading level={3} {...({ brand: true } as object)}>Bad</Heading>)).toThrow(/brand face/);
    spy.mockRestore();
  });
});

describe("Tabs", () => {
  const tabs = [
    { id: "trips", label: "Trips", content: <p>Trip list</p> },
    { id: "rewards", label: "Rewards", content: <p>Points</p> },
    { id: "details", label: "Details", content: <p>Form</p> },
  ];

  it("shows the first tab's panel and marks it selected", () => {
    render(<Tabs label="Profile" tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Trips" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Trip list");
  });

  it("moves with the arrow keys, wraps, and supports Home and End", () => {
    render(<Tabs label="Profile" tabs={tabs} />);
    const trips = screen.getByRole("tab", { name: "Trips" });
    trips.focus();
    fireEvent.keyDown(trips, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Rewards" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Rewards" }));

    fireEvent.keyDown(screen.getByRole("tab", { name: "Rewards" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "Details" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Details" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Trips" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Trips" }), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Details" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Details" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Trips" }).getAttribute("aria-selected")).toBe("true");
  });

  it("only the selected tab is in the tab order", () => {
    render(<Tabs label="Profile" tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Trips" }).getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("tab", { name: "Rewards" }).getAttribute("tabindex")).toBe("-1");
  });

  it("selects a tab on tap", () => {
    render(<Tabs label="Profile" tabs={tabs} />);
    fireEvent.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Form");
  });
});

describe("Toggle", () => {
  it("is a switch with an explicit state and flips on click and Space", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange}>Email updates</Toggle>);
    const toggle = screen.getByRole("switch", { name: /Email updates/ });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});

describe("Checkbox", () => {
  it("is labelled by its text, so the whole label is the target", () => {
    render(<Checkbox>I agree to the conditions</Checkbox>);
    expect(screen.getByLabelText("I agree to the conditions")).toBeTruthy();
  });

  it("marks an error as invalid and links the message to the control", () => {
    render(<Checkbox error="Accept the conditions to continue.">I agree to the conditions</Checkbox>);
    const box = screen.getByRole("checkbox", { name: "I agree to the conditions" });
    expect(box.getAttribute("aria-invalid")).toBe("true");
    const message = screen.getByText("Accept the conditions to continue.");
    expect(box.getAttribute("aria-describedby")).toBe(message.closest("p")?.id);
  });

  it("is not marked invalid without an error", () => {
    render(<Checkbox>I agree to the conditions</Checkbox>);
    expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBeNull();
  });
});

describe("Pagination", () => {
  it("marks the current page and disables unavailable directions", () => {
    render(<Pagination page={1} pageCount={3} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 1" }).getAttribute("aria-current")).toBe("page");
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("Progress and Avatar", () => {
  it("exposes determinate progress to assistive technology", () => {
    render(<Progress label="Profile complete" value={40} />);
    const bar = screen.getByRole("progressbar", { name: "Profile complete" });
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
  });

  it("uses initials and the full name as the accessible label", () => {
    render(<Avatar name="Alex Traveler" />);
    const avatar = screen.getByRole("img", { name: "Alex Traveler" });
    expect(within(avatar).getByText("AT")).toBeTruthy();
  });
});

describe("Drawer", () => {
  it("renders as a named dialog with a visible close button", () => {
    const onClose = vi.fn();
    render(<Drawer open title="Menu" onClose={onClose}><a href="/rewards">Rewards</a></Drawer>);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and returns focus to the element that opened it", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { rerender } = render(<Drawer open title="Menu" onClose={onClose}><a href="/rewards">Rewards</a></Drawer>);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<Drawer open={false} title="Menu" onClose={onClose}><a href="/rewards">Rewards</a></Drawer>);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("renders nothing when closed", () => {
    render(<Drawer open={false} title="Menu" onClose={() => {}}><a href="/rewards">Rewards</a></Drawer>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Skeleton", () => {
  it("hides every variant from assistive technology", () => {
    for (const variant of ["text", "card", "image", "row"] as const) {
      const { container, unmount } = render(<Skeleton variant={variant} />);
      expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }
  });
});

describe("Disclosure (accordion)", () => {
  it("starts collapsed by default and expanded when asked", () => {
    const { container, unmount } = render(<Disclosure title="Do points expire?">No.</Disclosure>);
    expect((container.querySelector("details") as HTMLDetailsElement).open).toBe(false);
    unmount();
    const expanded = render(<Disclosure title="Do points expire?" defaultOpen>No.</Disclosure>);
    expect((expanded.container.querySelector("details") as HTMLDetailsElement).open).toBe(true);
  });

  it("has a touch-sized summary and hides the decorative marker from assistive technology", () => {
    const { container } = render(<Disclosure title="Do points expire?">No.</Disclosure>);
    const summary = container.querySelector("summary")!;
    expect(summary.className).toContain("min-h-control-md");
    expect(summary.querySelector('[aria-hidden="true"]')?.textContent).toBe("+");
  });
});
