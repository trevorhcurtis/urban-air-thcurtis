import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DateField, SelectField, TextareaField, TextField } from "./Input";

const meta = {
  title: "Primitives/Form fields",
  component: TextField,
  args: { id: "email", label: "Passenger email", placeholder: "traveler@example.com" },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHelp: Story = { args: { help: "Confirmation details are sent here (simulated)." } };
export const Required: Story = { args: { required: true } };
export const Error: Story = { args: { error: "Please enter a valid email address.", defaultValue: "traveler@" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "traveler@example.com" } };

export const Select: StoryObj<typeof SelectField> = {
  render: () => (
    <SelectField id="city" label="Departure city" required>
      <option>Dallas (DFW)</option>
      <option>Los Angeles (LAX)</option>
    </SelectField>
  ),
};

export const Textarea: StoryObj<typeof TextareaField> = {
  render: () => <TextareaField id="assist" label="Special assistance" help="Optional." />,
};

export const DateInput: StoryObj<typeof DateField> = {
  render: () => <DateField id="depart" label="Departure date" help="Available within the next 30 days." />,
};
