import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Disclosure } from "./Disclosure";

const meta = {
  title: "Primitives/Accordion",
  component: Disclosure,
  args: { title: "How do I earn points?", children: "Points are added after each flight you take with Urban Air." },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};
export const Expanded: Story = { args: { defaultOpen: true } };

export const Group: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <Disclosure title="How do I earn points?">Points are added after each flight you take.</Disclosure>
      <Disclosure title="Do points expire?" defaultOpen>Points stay active for as long as your account is open.</Disclosure>
      <Disclosure title="What is the starting bonus?">New members receive a welcome bonus after their first trip.</Disclosure>
    </div>
  ),
};
