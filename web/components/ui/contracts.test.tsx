// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { ALERT_TONES } from "./Alert";
import { AVATAR_SIZES } from "./Avatar";
import { BADGE_TONES } from "./Badge";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "./Button";
import { DIVIDER_ORIENTATIONS, DIVIDER_WEIGHTS } from "./Divider";
import { DRAWER_SIDES } from "./Drawer";
import { HEADING_SIZES } from "./Heading";
import { ICON_SIZES } from "./Icon";
import { SKELETON_VARIANTS } from "./Skeleton";
import { TEXT_ROLES } from "./Text";

/**
 * Each contract lists the values a prop accepts. These registries point each listed prop at the
 * exported list the component really uses, so a contract that drifts from the code fails here.
 */
const REGISTRY: Record<string, Record<string, readonly string[]>> = {
  Button: { variant: BUTTON_VARIANTS, size: BUTTON_SIZES },
  Badge: { tone: BADGE_TONES },
  Alert: { tone: ALERT_TONES },
  Toast: { tone: ALERT_TONES },
  Heading: { level: ["1", "2", "3", "4"], size: HEADING_SIZES.map(String), brand: ["false", "true"] },
  Text: { role: TEXT_ROLES },
  Icon: { size: ICON_SIZES },
  Skeleton: { variant: SKELETON_VARIANTS },
  Toggle: {},
  Input: {},
  Card: {},
  Divider: { orientation: DIVIDER_ORIENTATIONS, weight: DIVIDER_WEIGHTS },
  Avatar: { size: AVATAR_SIZES },
  Drawer: { side: DRAWER_SIDES },
};

const DIR = join(__dirname);
const CONTRACT_FILES = readdirSync(DIR).filter((f) => f.endsWith(".contract.json"));
const schema = JSON.parse(readFileSync(join(DIR, "..", "..", "design-system", "schema", "component.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

describe("component contracts", () => {
  it("there is one contract per registered component, and no unregistered contracts", () => {
    expect(CONTRACT_FILES.map((f) => f.replace(".contract.json", "")).sort()).toEqual(Object.keys(REGISTRY).sort());
  });

  for (const file of CONTRACT_FILES) {
    const contract = JSON.parse(readFileSync(join(DIR, file), "utf8"));

    describe(contract.name ?? file, () => {
      it("matches the component contract schema", () => {
        const ok = validate(contract);
        expect(ok, JSON.stringify(validate.errors)).toBe(true);
      });

      it("points at a component source file that exists", () => {
        const source = join(DIR, "..", "..", contract.source);
        expect(() => readFileSync(source, "utf8")).not.toThrow();
      });

      it("lists the same values as the component's exported lists", () => {
        const registered = REGISTRY[contract.name] ?? {};
        expect(Object.keys(contract.props).sort()).toEqual(Object.keys(registered).sort());
        for (const [prop, spec] of Object.entries<{ values: string[] }>(contract.props)) {
          expect([...spec.values].sort(), `${contract.name}.${prop}`).toEqual([...registered[prop]].map(String).sort());
        }
      });

      it("uses a default that is one of the listed values", () => {
        for (const [prop, spec] of Object.entries<{ values: string[]; default?: string }>(contract.props)) {
          if (spec.default !== undefined) expect(spec.values, `${contract.name}.${prop}`).toContain(spec.default);
        }
      });
    });
  }
});
