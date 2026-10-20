import { notFound } from "next/navigation";
import tokens from "@/design-system/tokens.resolved.json";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Divider } from "@/components/ui/Divider";
import { Heading } from "@/components/ui/Heading";
import { DateField, SelectField, TextareaField, TextField } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { TextLink } from "@/components/ui/Link";
import { Radio } from "@/components/ui/Radio";
import { Text } from "@/components/ui/Text";
import { Tooltip } from "@/components/ui/Tooltip";
import { BoardingPass } from "@/components/booking/BoardingPass";
import { Demos } from "./Demos";

const GROUPS = ["surface", "text", "solid", "border", "decorative"] as const;
const SPACING = [4, 8, 12, 16, 20, 24, 32, 48, 64, 80];
const RADII = ["radius-sm", "radius-md", "radius-lg", "radius-xl", "radius-2xl", "radius-full"];
const CONTROLS = ["control-sm", "control-md", "control-lg", "control-xl"];
const SHADOWS = ["shadow-card", "shadow-popover", "shadow-modal"];
const MOTION = ["duration-fast", "duration-standard", "duration-slow"];

/** Development only. Shows every design token and the core components. Not served in production. */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-12 px-4 py-10">
      <Heading level={1} size={2}>Styleguide</Heading>
      <Text role="helper">Values come from design-system/tokens. Primitives are also documented in Storybook (pnpm run storybook).</Text>

      <section className="space-y-6" aria-labelledby="sg-colors">
        <Heading level={2} size={4} id="sg-colors">Colors</Heading>
        {GROUPS.map((group) => {
          const items = tokens.colors.filter((c) => c.group === group);
          return (
            <div key={group} className="space-y-3">
              <Text role="label">{group}</Text>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {items.map((c) => (
                  <li key={c.token} className="space-y-1 text-sm">
                    {group === "text" ? (
                      <div className="flex h-12 items-center rounded-md border border-border-subtle bg-surface-canvas px-3" style={{ color: `var(--color-${c.name})` }}>
                        <span className="text-md font-semibold">Aa Sample</span>
                      </div>
                    ) : (
                      <div className="h-12 rounded-md border border-border-subtle" style={{ background: `var(--color-${c.name})` }} />
                    )}
                    <p className="font-mono text-xs text-text-primary">{c.name}</p>
                    <p className="font-mono text-xs text-text-muted">{c.value}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="space-y-4" aria-labelledby="sg-type">
        <Heading level={2} size={4} id="sg-type">Type</Heading>
        <Heading level={1} brand>Fly Further Together.</Heading>
        <Text role="lead">Lead copy at 18 pixels, Inter 400. Used for introductions.</Text>
        <Text role="body">Body text at 16 pixels, Inter 400. The default reading size.</Text>
        <Text role="label">Label at 14 pixels, Inter 500. Form labels and navigation.</Text>
        <Text role="helper">Helper text at 14 pixels, muted. Supporting detail under a field.</Text>
        <Text role="meta">Metadata at 12 pixels. Dense information only.</Text>
        <Heading level={2} size={2}>Section heading, Inter 600 at 32 pixels</Heading>
        <Heading level={3} size={3}>Subsection heading, Inter 600 at 24 pixels</Heading>
        <Heading level={4}>Card heading, Inter 600 at 20 pixels</Heading>
      </section>

      <section className="space-y-4" aria-labelledby="sg-buttons">
        <Heading level={2} size={4} id="sg-buttons">Buttons</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small (36px)</Button>
          <Button size="md">Medium (44px)</Button>
          <Button size="lg">Large (48px)</Button>
          <Button size="xl">Extra large (52px)</Button>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="sg-forms">
        <Heading level={2} size={4} id="sg-forms">Forms</Heading>
        <TextField id="sg-field" label="Passenger email" help="Confirmation details are sent here (simulated)." />
        <TextField id="sg-error" label="Passenger email" error="Please enter a valid email address." />
        <SelectField id="sg-select" label="Departure city">
          <option>Dallas (DFW)</option>
          <option>Los Angeles (LAX)</option>
        </SelectField>
        <DateField id="sg-date" label="Departure date" help="Available within the next 30 days." />
        <TextareaField id="sg-text" label="Special assistance" help="Optional." />
        <Checkbox>I agree to the fare conditions</Checkbox>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-text-primary">Trip type</legend>
          <Radio name="sg-trip" defaultChecked>Round-trip</Radio>
          <Radio name="sg-trip">One-way</Radio>
        </fieldset>
      </section>

      <section className="space-y-4" aria-labelledby="sg-status">
        <Heading level={2} size={4} id="sg-status">Status</Heading>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="success">Confirmed</Badge>
          <Badge tone="warning">Check details</Badge>
          <Badge tone="error">Issue</Badge>
        </div>
        <Alert tone="info" title="Info">Helpful information.</Alert>
        <Alert tone="success" title="Success">Confirmed.</Alert>
        <Alert tone="warning" title="Warning">Attention, check details.</Alert>
        <Alert tone="error" title="Error">Issue. Try again.</Alert>
        <p className="text-text-primary">
          <Tooltip content="Hover on desktop, tap on touch.">Hover or tap this label</Tooltip>
        </p>
        <p className="text-text-primary">
          <TextLink href="/help">Text links are underlined</TextLink>
        </p>
        <div className="flex items-center gap-3 text-text-primary">
          <Icon size="sm" label="Done"><path d="M5 12l4 4 10-10" /></Icon>
          <Icon size="md"><path d="M5 12l4 4 10-10" /></Icon>
          <Icon size="lg"><path d="M5 12l4 4 10-10" /></Icon>
          <Icon size="xl"><path d="M5 12l4 4 10-10" /></Icon>
          <Text role="meta">Icons at 16, 20, 24, and 32 pixels</Text>
        </div>
        <Divider />
        <Divider weight="strong" />
      </section>

      <section className="space-y-4" aria-labelledby="sg-airline">
        <Heading level={2} size={4} id="sg-airline">Airline patterns</Heading>
        <BoardingPass
          direction="Outbound"
          leg={{
            flight_number: "UA104",
            flight_date: "2026-10-20",
            origin: "DFW",
            destination: "LAX",
            depart_time: "08:15",
            arrive_time: "10:02",
            class_label: "Economy",
          }}
          seats={["12A"]}
          passengers={["Alex Traveler"]}
        />
        <Card>
          <Text role="body">Card with the standard surface and card elevation.</Text>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="sg-tokens">
        <Heading level={2} size={4} id="sg-tokens">Spacing, shape, and motion</Heading>
        <Text role="label">Spacing (4px base)</Text>
        <ul className="flex flex-wrap items-end gap-3 text-xs text-text-muted">
          {SPACING.map((px) => (
            <li key={px} className="flex flex-col items-center gap-1">
              <span className="block bg-surface-interactive" style={{ width: px, height: px }} />
              {px}px
            </li>
          ))}
        </ul>
        <Text role="label">Radius</Text>
        <ul className="flex flex-wrap gap-4 text-xs text-text-muted">
          {RADII.map((name) => (
            <li key={name} className="flex flex-col items-center gap-1">
              <span className="block h-12 w-16 border border-border-default bg-surface-brand" style={{ borderRadius: `var(--${name})` }} />
              {name}
            </li>
          ))}
        </ul>
        <Text role="label">Control heights</Text>
        <ul className="flex flex-wrap gap-4 text-xs text-text-muted">
          {CONTROLS.map((name) => (
            <li key={name} className="flex flex-col gap-1">
              <span className="block w-28 rounded-md border border-border-default bg-surface-brand" style={{ height: `var(--height-${name})` }} />
              {name}
            </li>
          ))}
        </ul>
        <Text role="label">Elevation</Text>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SHADOWS.map((name) => (
            <li key={name} className={`rounded-lg bg-surface-canvas p-6 text-sm text-text-primary ${name}`}>{name}</li>
          ))}
        </ul>
        <Text role="label">Motion</Text>
        <ul className="flex flex-wrap gap-4 text-sm text-text-muted">
          {MOTION.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>

      <Demos />
    </main>
  );
}
