import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { Divider } from "./Divider";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";
import { TextLink } from "./Link";
import { Button } from "./Button";

const meta = {
  title: "Primitives/Surfaces",
  component: Card,
  args: { children: "Card with the standard surface and card elevation." },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CardSurface: Story = {};

export const Dividers: StoryObj<typeof Divider> = {
  render: () => (
    <div className="space-y-4">
      <Divider />
      <Divider weight="strong" />
      <div className="flex h-12 items-stretch gap-4">
        <Divider orientation="vertical" />
        <Divider orientation="vertical" weight="strong" />
      </div>
    </div>
  ),
};

export const Icons: StoryObj<typeof Icon> = {
  render: () => (
    <div className="flex items-center gap-4 text-text-primary">
      <Icon size="sm" label="Done"><path d="M5 12l4 4 10-10" /></Icon>
      <Icon size="md"><path d="M5 12l4 4 10-10" /></Icon>
      <Icon size="lg"><path d="M5 12l4 4 10-10" /></Icon>
      <Icon size="xl"><path d="M5 12l4 4 10-10" /></Icon>
    </div>
  ),
};

export const Avatars: StoryObj<typeof Avatar> = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Alex Traveler" size="sm" />
      <Avatar name="Jordan Rivera" />
      <Avatar name="Sam Chen" size="lg" />
    </div>
  ),
};

export const EmptyStateWithAction: StoryObj<typeof EmptyState> = {
  render: () => (
    <EmptyState title="No trips yet" action={<Button variant="soft">Find a flight</Button>}>
      Trips you book appear here for 24 hours in this browser.
    </EmptyState>
  ),
};

export const Link: StoryObj<typeof TextLink> = {
  render: () => <TextLink href="/help">Text links are underlined</TextLink>,
};
