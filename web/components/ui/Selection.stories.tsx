import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { Radio } from "./Radio";
import { Toggle } from "./Toggle";

const meta = {
  title: "Primitives/Selection",
  component: Checkbox,
  args: { children: "I agree to the Urban Air conditions of carriage." },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Invalid: Story = { args: { error: "Accept the conditions to continue." } };

export const RadioGroup: StoryObj = {
  render: () => (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-text-primary">Trip type</legend>
      <Radio name="trip" defaultChecked>Round-trip</Radio>
      <Radio name="trip">One-way</Radio>
    </fieldset>
  ),
};

export const ToggleSwitch: StoryObj = {
  render: function ToggleStory() {
    const [on, setOn] = useState(true);
    return <Toggle checked={on} onChange={setOn}>Email me flight updates</Toggle>;
  },
};
