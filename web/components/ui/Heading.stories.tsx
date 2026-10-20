import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "./Heading";
import { Text } from "./Text";

const meta = {
  title: "Primitives/Typography",
  component: Heading,
  args: { level: 2, size: 2, children: "Section heading" },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BookingHeading: Story = { args: { level: 1, size: 2, children: "Passenger details" } };
export const BrandHeading: Story = { args: { level: 1, brand: true, children: "Fly Further Together." } };

export const Scale: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <Heading level={1} size={2}>Title, Inter 600 at 32 pixels</Heading>
      <Heading level={2} size={2}>Section, Inter 600 at 32 pixels</Heading>
      <Heading level={3} size={3}>Subsection, Inter 600 at 24 pixels</Heading>
      <Heading level={4}>Card heading, Inter 600 at 20 pixels</Heading>
    </div>
  ),
};

export const TextRoles: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <Text role="lead">Lead copy at 18 pixels.</Text>
      <Text role="body">Body text at 16 pixels.</Text>
      <Text role="label">Label at 14 pixels.</Text>
      <Text role="helper">Helper text at 14 pixels, muted.</Text>
      <Text role="meta">Metadata at 12 pixels.</Text>
    </div>
  ),
};
