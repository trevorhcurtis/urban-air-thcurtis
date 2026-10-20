import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Alert } from "./Alert";
import { Badge } from "./Badge";
import { Progress } from "./Progress";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { Toast } from "./Toast";

const meta = {
  title: "Primitives/Feedback",
  component: Badge,
  args: { children: "Confirmed" },
  argTypes: { tone: { control: "select", options: ["neutral", "info", "success", "warning", "error"] } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BadgeTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Neutral</Badge>
      <Badge tone="info">Info</Badge>
      <Badge tone="success">Confirmed</Badge>
      <Badge tone="warning">Check details</Badge>
      <Badge tone="error">Issue</Badge>
    </div>
  ),
};

export const Alerts: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <Alert tone="info" title="Info">Helpful information.</Alert>
      <Alert tone="success" title="Success">Confirmed.</Alert>
      <Alert tone="warning" title="Warning">Attention, check details.</Alert>
      <Alert tone="error" title="Error">Payment is busy. Try again.</Alert>
    </div>
  ),
};

export const ToastMessage: StoryObj = {
  render: function ToastStory() {
    const [open, setOpen] = useState(true);
    return open ? (
      <Toast tone="warning" title="Fare changed since your search" onDismiss={() => setOpen(false)}>
        Check your fare before you pay.
      </Toast>
    ) : (
      <button type="button" className="text-text-link underline" onClick={() => setOpen(true)}>Show toast again</button>
    );
  },
};

export const ProgressStates: StoryObj = {
  render: () => (
    <div className="max-w-md space-y-4">
      <Progress label="Profile complete" value={60} />
      <Progress label="Loading flights" />
    </div>
  ),
};

export const LoadingStates: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Spinner label="Finding flights" />
      <Skeleton variant="text" />
      <Skeleton variant="row" />
      <Skeleton variant="card" />
      <Skeleton variant="image" />
    </div>
  ),
};
