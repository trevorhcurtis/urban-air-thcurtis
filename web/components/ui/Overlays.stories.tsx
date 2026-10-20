import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "./Button";
import { Drawer } from "./Drawer";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Primitives/Overlays",
  component: Modal,
  args: { open: true, title: "Cancel this booking?", onClose: () => {}, children: null },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModalDialog: Story = {
  render: function ModalStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>Cancel booking</Button>
        <Modal open={open} title="Cancel this booking?" onClose={() => setOpen(false)}>
          <p className="text-sm text-text-primary">Esc, a tap on the backdrop, or a button closes this dialog.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>Keep booking</Button>
            <Button variant="destructive" onClick={() => setOpen(false)}>Cancel booking</Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const DrawerPanel: StoryObj<typeof Drawer> = {
  render: function DrawerStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Open menu</Button>
        <Drawer open={open} title="Menu" onClose={() => setOpen(false)}>
          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1 text-md font-medium text-text-primary">
              <li><a className="block rounded-md px-3 py-3 hover:bg-surface-brand" href="/book/search">Book</a></li>
              <li><a className="block rounded-md px-3 py-3 hover:bg-surface-brand" href="/rewards">Rewards</a></li>
              <li><a className="block rounded-md px-3 py-3 hover:bg-surface-brand" href="/partners">Partners</a></li>
            </ul>
          </nav>
        </Drawer>
      </>
    );
  },
};

export const TooltipOnLabel: StoryObj<typeof Tooltip> = {
  render: () => (
    <p className="text-text-primary">
      <Tooltip content="Hover on desktop, tap on touch.">Hover or tap this label</Tooltip>
    </p>
  ),
};
