import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, ButtonLink } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Continue to seats" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "soft", "ghost", "destructive"] },
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Soft: Story = { args: { variant: "soft" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Cancel booking" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, children: "Pay and confirm" } };

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra large</Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => <ButtonLink href="/book/search" variant="secondary">Start a booking</ButtonLink>,
};
