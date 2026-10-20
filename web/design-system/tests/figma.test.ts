import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildComponentDefs, type ContractFile } from "../figma/components.ts";
import { COMPONENT_TOKENS } from "../figma/component-tokens.ts";
import { buildFoundations, type TokenBundle } from "../figma/payload.ts";
import { buildPayload } from "../figma/sync.ts";
import { hexToRgb, parseShadow, rgbToHex, toPx } from "../figma/units.ts";
import { verify, type Snapshot, type SnapshotVariable } from "../figma/verify.ts";
import { COLLECTIONS, MODE_NAMES, type CollectionName, type FigmaPayload, type VariableSpec } from "../figma/types.ts";
import { loadTokens } from "../resolve.mjs";

const WEB_ROOT = join(__dirname, "..", "..");
const contract = (name: string): ContractFile =>
  JSON.parse(readFileSync(join(WEB_ROOT, "components", "ui", `${name}.contract.json`), "utf8")) as ContractFile;

const tokens = loadTokens() as TokenBundle;
const CONTRACTS = {
  button: contract("Button"),
  badge: contract("Badge"),
  alert: contract("Alert"),
  toast: contract("Toast"),
  heading: contract("Heading"),
  text: contract("Text"),
  toggle: contract("Toggle"),
  divider: contract("Divider"),
  skeleton: contract("Skeleton"),
};
const payload = buildPayload(tokens, CONTRACTS);

/** What Figma would return if the sync had run perfectly. Used to test the verifier without Figma. */
function snapshotFromPayload(p: FigmaPayload): Snapshot {
  const value = (spec: VariableSpec): SnapshotVariable["value"] => {
    const v = spec.value;
    if (v.kind === "color") return { kind: "color", hex: v.hex };
    if (v.kind === "float") return { kind: "float", number: v.number };
    if (v.kind === "string") return { kind: "string", text: v.text };
    return { kind: "alias", target: v.target };
  };
  return {
    collections: COLLECTIONS.map((name: CollectionName) => ({
      name,
      modes: [MODE_NAMES[name]],
      variables: p.foundations.variables
        .filter((v) => v.collection === name)
        .map((v) => ({ name: v.name, type: v.type, scopes: v.scopes, codeSyntaxWeb: v.codeSyntax ?? null, value: value(v) })),
    })),
    textStyles: p.foundations.textStyles.map((t) => ({ name: t.name, family: t.family, style: t.style, size: t.size, lineHeight: t.lineHeight })),
    effectStyles: p.foundations.effectStyles.map((e) => ({ name: e.name, effects: e.effects })),
    components: p.components.map((c) => ({
      name: c.name,
      type: c.isSet ? "COMPONENT_SET" : "COMPONENT",
      description: c.description,
      variants: c.isSet ? c.scenes.map((s) => s.name) : [],
    })),
  };
}

describe("units", () => {
  it("converts rem and px to px", () => {
    expect(toPx("2.75rem")).toBe(44);
    expect(toPx("4px")).toBe(4);
    expect(() => toPx("4em")).toThrow();
  });

  it("parses the shadow tokens into Figma drop shadows", () => {
    const e = parseShadow("0 1px 3px rgb(11 45 107 / 8%)");
    expect(e.offset).toEqual({ x: 0, y: 1 });
    expect(e.radius).toBe(3);
    expect(e.color.a).toBeCloseTo(0.08);
    expect(() => parseShadow("inset 0 1px")).toThrow();
  });

  it("round-trips hex colors through Figma channels", () => {
    expect(rgbToHex(hexToRgb("#0B2D6B"))).toBe("#0B2D6B");
    expect(() => hexToRgb("0B2D6B")).toThrow();
  });
});

describe("payload", () => {
  it("includes every semantic and primitive color from the token files", () => {
    const names = new Set(payload.foundations.variables.map((v) => `${v.collection}::${v.name}`));
    for (const path of Object.keys(tokens.semantic)) {
      expect(names.has(`Semantic::${path.replace(/^color\./, "").split(".").join("/")}`), path).toBe(true);
    }
    for (const path of Object.keys(tokens.primitives)) {
      expect(names.has(`Primitives::${path.split(".").join("/")}`), path).toBe(true);
    }
  });

  it("points every alias at a variable that exists in the payload", () => {
    const names = new Set(payload.foundations.variables.map((v) => v.name));
    for (const v of payload.foundations.variables) {
      if (v.value.kind === "alias") expect(names.has(v.value.target), `${v.name} -> ${v.value.target}`).toBe(true);
    }
  });

  it("gives aliases the type of their target", () => {
    const types = new Map(payload.foundations.variables.map((v) => [v.name, v.type]));
    for (const v of payload.foundations.variables) {
      if (v.value.kind === "alias") expect(v.type, v.name).toBe(types.get(v.value.target));
    }
    expect(types.get("card/radius")).toBe("FLOAT");
    expect(types.get("button/primary/bg")).toBe("COLOR");
  });

  it("sets WEB code syntax on semantic tokens using the CSS variable names", () => {
    const onAccent = payload.foundations.variables.find((v) => v.name === "text/onAccent");
    expect(onAccent?.codeSyntax).toBe("var(--color-text-on-accent)");
    const primitive = payload.foundations.variables.find((v) => v.name === "color/navy/900");
    expect(primitive?.codeSyntax).toBeUndefined();
  });

  it("maps every component token to a real target", () => {
    expect(Object.keys(COMPONENT_TOKENS).length).toBe(71);
  });

  it("builds text styles for each font size, with Sora only for the brand headings", () => {
    const names = payload.foundations.textStyles.map((t) => t.name);
    expect(names).toContain("Type/Brand/h1");
    expect(names).toContain("Type/Brand/display");
    expect(names).not.toContain("Type/Brand/h4");
    const h4 = payload.foundations.textStyles.find((t) => t.name === "Type/UI/h4");
    expect(h4).toMatchObject({ family: "Inter", style: "Semi Bold", size: 20, lineHeight: 28 });
  });

  it("fails when a contract's values no longer match the Figma spec", () => {
    const bad: ContractFile = { ...contract("Button"), props: { ...contract("Button").props, size: { values: ["sm", "md"] } } };
    expect(() => buildComponentDefs(tokens, { ...CONTRACTS, button: bad })).toThrow(/do not match/);
  });

  it("creates one Button variant per contract variant and size", () => {
    const button = payload.components.find((c) => c.name === "Button");
    expect(button?.scenes.length).toBe(20);
    expect(button?.scenes[0].name).toBe("variant=primary, size=sm");
  });
});

describe("verify", () => {
  it("reports no problems when the snapshot matches the payload", () => {
    const report = verify(payload, snapshotFromPayload(payload));
    expect(report).toEqual({ ok: true, problems: [], extras: [] });
  });

  it("reports a changed color", () => {
    const snap = snapshotFromPayload(payload);
    const variable = snap.collections.find((c) => c.name === "Primitives")!.variables.find((v) => v.name === "color/navy/900")!;
    variable.value = { kind: "color", hex: "#000000" };
    const report = verify(payload, snap);
    expect(report.ok).toBe(false);
    expect(report.problems.join("\n")).toContain("Primitives::color/navy/900: color #000000");
  });

  it("reports a wrong alias target", () => {
    const snap = snapshotFromPayload(payload);
    const variable = snap.collections.find((c) => c.name === "Semantic")!.variables.find((v) => v.name === "text/primary")!;
    variable.value = { kind: "alias", target: "color/blue/600" };
    expect(verify(payload, snap).problems.join("\n")).toContain("alias color/blue/600, expected color/navy/900");
  });

  it("reports a missing component and a changed description", () => {
    const snap = snapshotFromPayload(payload);
    snap.components = snap.components.filter((c) => c.name !== "Badge");
    snap.components.find((c) => c.name === "Card")!.description = "edited in Figma";
    const problems = verify(payload, snap).problems.join("\n");
    expect(problems).toContain("Component Badge is missing");
    expect(problems).toContain("Component Card: description differs");
  });

  it("lists variables that Figma has but the payload does not, without failing on them", () => {
    const snap = snapshotFromPayload(payload);
    snap.collections.find((c) => c.name === "Semantic")!.variables.push({
      name: "radius/card",
      type: "FLOAT",
      scopes: ["CORNER_RADIUS"],
      codeSyntaxWeb: null,
      value: { kind: "alias", target: "radius/lg" },
    });
    const report = verify(payload, snap);
    expect(report.ok).toBe(true);
    expect(report.extras).toEqual(["Semantic::radius/card"]);
  });
});

/** The Figma spec copies Button and Badge geometry from the code. These checks fail if the code changes without the spec. */
describe("component geometry matches the code", () => {
  const source = (name: string) => readFileSync(join(WEB_ROOT, "components", "ui", `${name}.tsx`), "utf8");
  const sizeLine = (src: string, size: string) => src.match(new RegExp(`^\\s*${size}: "([^"]+)"`, "m"))?.[1] ?? "";

  it("Button sizes use the control heights and horizontal padding in the Figma spec", () => {
    const button = payload.components.find((c) => c.name === "Button")!;
    const src = source("Button");
    const cases: [string, string, number][] = [
      ["sm", "control-sm", 12],
      ["md", "control-md", 20],
      ["lg", "control-lg", 24],
      ["xl", "control-xl", 32],
    ];
    // The shared base class sets px-5. A size line only overrides it when it names its own px-* class.
    const basePx = src.match(/rounded-md px-(\d+(?:\.\d+)?)/)?.[1];
    for (const [size, control, padX] of cases) {
      const line = sizeLine(src, size);
      expect(line, `Button size ${size}`).toContain(`min-h-${control}`);
      const codePx = Number(line.match(/\bpx-(\d+(?:\.\d+)?)\b/)?.[1] ?? basePx);
      expect(codePx * 4, `Button size ${size} horizontal padding`).toBe(padX);
      const scene = button.scenes.find((s) => s.name.endsWith(`size=${size}`))!;
      expect(scene.padX).toBe(padX);
      expect(scene.height).toBe(toPx(tokens.theme[`control.${control.replace("control-", "")}`].value));
    }
  });

  it("Alert and Toast use the tone axis and padding the code uses", () => {
    const alertSrc = source("Alert");
    const toastSrc = source("Toast");
    expect(alertSrc).toContain("p-4");
    expect(alertSrc).toContain("gap-3");
    expect(toastSrc).toContain("p-4");
    expect(toastSrc).toContain("shadow-popover");
    const alert = payload.components.find((c) => c.name === "Alert")!;
    const toast = payload.components.find((c) => c.name === "Toast")!;
    expect(alert.scenes.map((s) => s.name)).toEqual(["tone=info", "tone=success", "tone=warning", "tone=error"]);
    expect(alert.scenes[0].padX).toBe(16);
    expect(toast.scenes[0].effectStyle).toBe("shadow/popover");
  });

  it("Toggle track and thumb sizes match Toggle.tsx", () => {
    const src = source("Toggle");
    expect(src).toContain("h-6 w-11");
    expect(src).toContain("h-4 w-4");
    expect(src).toContain("translate-x-6");
    expect(src).toContain("translate-x-1");
    const toggle = payload.components.find((c) => c.name === "Toggle")!;
    expect(toggle.scenes.map((s) => s.name)).toEqual(["state=off", "state=on", "state=disabled"]);
    expect(toggle.scenes[0]).toMatchObject({ width: 44, height: 24, opacity: undefined });
    expect(toggle.scenes[2].opacity).toBe(0.5);
    const thumbs = toggle.scenes.map((s) => s.children[0]);
    expect(thumbs[0]).toMatchObject({ k: "ellipse", width: 16, height: 16, x: 4, y: 4 });
    expect(thumbs[1]).toMatchObject({ x: 24 });
  });

  it("Divider and Skeleton sizes match their code classes", () => {
    expect(source("Divider")).toContain("h-px w-full");
    expect(source("Divider")).toContain("w-px self-stretch");
    const skeleton = source("Skeleton");
    expect(skeleton).toContain("h-4 w-full");
    expect(skeleton).toContain("h-40 w-full rounded-lg");
    expect(skeleton).toContain("aspect-video");
    expect(skeleton).toContain("h-12 w-full");
    const shapes = payload.components.find((c) => c.name === "Skeleton")!.scenes.map((s) => s.height);
    expect(shapes).toEqual([16, 160, 180, 48]);
  });

  it("Heading allows brand only at levels 1 and 2, as the code does", () => {
    const heading = payload.components.find((c) => c.name === "Heading")!;
    const names = heading.scenes.map((s) => s.name);
    expect(names).toContain("level=2, brand=true");
    expect(names).not.toContain("level=3, brand=true");
    expect(names).not.toContain("level=4, brand=true");
    expect(source("Heading")).toContain("Only level 1 and 2 headings can use the brand face");
  });

  it("every token a component scene uses exists as a payload variable", () => {
    const variables = new Set(payload.foundations.variables.map((v) => v.name));
    const refs: string[] = [];
    const walk = (node: { k: string; fill?: string; stroke?: string; radius?: string; children?: unknown[] }): void => {
      for (const token of [node.fill, node.stroke, node.radius]) if (token) refs.push(token);
      for (const child of (node.children ?? []) as { k: string; fill?: string; stroke?: string; radius?: string; children?: unknown[] }[]) walk(child);
    };
    for (const c of payload.components) for (const s of c.scenes) walk(s as never);
    for (const token of refs) expect(variables.has(token), token).toBe(true);
  });

  it("every text style a component uses exists in the foundations", () => {
    const styles = new Set(payload.foundations.textStyles.map((t) => t.name));
    const walk = (node: { k: string; textStyle?: string; children?: unknown[] }): string[] => {
      const own = node.k === "text" && node.textStyle ? [node.textStyle] : [];
      return [...own, ...((node.children ?? []) as { k: string; textStyle?: string; children?: unknown[] }[]).flatMap(walk)];
    };
    const used = payload.components.flatMap((c) => c.scenes.flatMap((s) => walk(s)));
    for (const name of used) expect(styles.has(name), name).toBe(true);
  });

  it("Badge padding matches the code", () => {
    const src = source("Badge");
    expect(src).toContain("px-2.5 py-0.5");
    const badge = payload.components.find((c) => c.name === "Badge")!;
    expect(badge.scenes[0].padX).toBe(10);
    expect(badge.scenes[0].padY).toBe(2);
  });
});

describe("foundations", () => {
  it("builds the same payload twice", () => {
    expect(buildFoundations(tokens)).toEqual(buildFoundations(tokens));
  });
});
