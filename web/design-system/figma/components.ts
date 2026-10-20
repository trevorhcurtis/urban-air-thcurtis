// Component definitions for Figma: Button, Badge, Input, Card. Variant axes for Button and Badge come from
// their contracts, so the Figma sets match the exported code values. Geometry comes from the theme tokens.
// Input states are a Figma-only choice (the contract has no state prop), listed here explicitly.

import type { TokenBundle } from "./payload.ts";
import { toPx } from "./units.ts";
import type { ComponentDef, FontFamily, FontStyle, FrameScene, SceneNode, TextScene } from "./types.ts";

export interface ContractFile {
  name: string;
  props: Record<string, { values: string[]; default?: string }>;
  states?: string[];
}

type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonSpec {
  bg?: string;
  stroke?: string;
  text: string;
}

const BUTTON_VARIANTS: Record<ButtonVariant, ButtonSpec> = {
  primary: { bg: "button/primary/bg", text: "button/primary/text" },
  secondary: { bg: "button/secondary/bg", stroke: "button/secondary/border", text: "button/secondary/text" },
  soft: { bg: "button/soft/bg", text: "button/soft/text" },
  ghost: { text: "button/ghost/text" },
  destructive: { bg: "button/destructive/bg", text: "button/destructive/text" },
};

interface ButtonGeometry {
  control: "control.sm" | "control.md" | "control.lg" | "control.xl";
  padX: number;
  font: "fontSize.sm" | "fontSize.md" | "fontSize.lg";
}

const BUTTON_SIZES: Record<ButtonSize, ButtonGeometry> = {
  sm: { control: "control.sm", padX: 12, font: "fontSize.sm" },
  md: { control: "control.md", padX: 20, font: "fontSize.md" },
  lg: { control: "control.lg", padX: 24, font: "fontSize.md" },
  xl: { control: "control.xl", padX: 32, font: "fontSize.lg" },
};

const BADGE_TONES = ["neutral", "info", "success", "warning", "error"] as const;
type BadgeTone = (typeof BADGE_TONES)[number];

const INPUT_STATES = ["default", "hover", "filled", "error"] as const;
type InputState = (typeof INPUT_STATES)[number];

/** Reads a theme token and converts it to px. Throws if the token is missing. */
function px(bundle: TokenBundle, key: string): number {
  const leaf = bundle.theme[key];
  if (!leaf) throw new Error(`Missing theme token ${key}`);
  return toPx(leaf.value);
}

/** Checks that a contract's values are exactly the keys the Figma spec defines, in any order. */
function assertSameValues(contract: string, prop: string, contractValues: string[], specKeys: readonly string[]): void {
  const a = [...contractValues].sort().join(",");
  const b = [...specKeys].sort().join(",");
  if (a !== b) throw new Error(`${contract}.${prop} values ${a} do not match the Figma spec ${b}`);
}

function buttonDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const variants = contract.props.variant?.values;
  const sizes = contract.props.size?.values;
  if (!variants || !sizes) throw new Error("Button contract must list variant and size");
  assertSameValues("Button", "variant", variants, Object.keys(BUTTON_VARIANTS));
  assertSameValues("Button", "size", sizes, Object.keys(BUTTON_SIZES));

  const scenes: FrameScene[] = [];
  for (const variant of variants as ButtonVariant[]) {
    for (const size of sizes as ButtonSize[]) {
      const spec = BUTTON_VARIANTS[variant];
      const geo = BUTTON_SIZES[size];
      scenes.push({
        k: "frame",
        name: `variant=${variant}, size=${size}`,
        layout: "HORIZONTAL",
        primaryAlign: "CENTER",
        counterAlign: "CENTER",
        gap: 8,
        padX: geo.padX,
        padY: 0,
        sizing: { primary: "AUTO", counter: "FIXED" },
        width: 120,
        height: px(bundle, geo.control),
        fill: spec.bg,
        stroke: spec.stroke,
        radius: "control/radius",
        children: [text("Button", "Inter", "Semi Bold", px(bundle, geo.font), spec.text)],
      });
    }
  }
  return {
    name: "Button",
    description:
      "Primary action control. Axes: variant (primary, secondary, soft, ghost, destructive) and size (sm, md, lg, xl). Default state only. Hover and pressed are in the Button States set. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "grid", cols: sizes.length, gapX: 170, gapY: 72 },
    origin: { x: 0, y: 0 },
    scenes,
  };
}

type ButtonState = "default" | "hover" | "pressed";

/** Fill and text tokens for each button state, read from Button.tsx. `bg` is absent where the button has no fill. */
const BUTTON_STATE_TOKENS: Record<ButtonVariant, Record<ButtonState, { bg?: string; text: string }>> = {
  primary: {
    default: { bg: "button/primary/bg", text: "button/primary/text" },
    hover: { bg: "button/primary/bg-hover", text: "button/primary/text" },
    pressed: { bg: "button/primary/bg-pressed", text: "button/primary/text" },
  },
  secondary: {
    default: { bg: "button/secondary/bg", text: "button/secondary/text" },
    hover: { bg: "button/secondary/bg-hover", text: "button/secondary/text" },
    pressed: { bg: "button/secondary/bg-pressed", text: "button/secondary/text" },
  },
  soft: {
    default: { bg: "button/soft/bg", text: "button/soft/text" },
    hover: { bg: "button/soft/bg-hover", text: "button/soft/text" },
    pressed: { bg: "button/soft/bg-pressed", text: "button/soft/text" },
  },
  ghost: {
    default: { text: "button/ghost/text" },
    hover: { bg: "button/ghost/bg-hover", text: "button/ghost/text" },
    pressed: { bg: "button/ghost/bg-pressed", text: "button/ghost/text-pressed" },
  },
  destructive: {
    default: { bg: "button/destructive/bg", text: "button/destructive/text" },
    hover: { bg: "button/destructive/bg-hover", text: "button/destructive/text" },
    pressed: { bg: "button/destructive/bg-pressed", text: "button/destructive/text" },
  },
};

/** Button states at the md size, as their own set: variant × state is 15 combinations, under the 30 cap. */
function buttonStatesDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const variants = contract.props.variant?.values;
  if (!variants) throw new Error("Button contract must list variant");
  assertSameValues("Button", "variant", variants, Object.keys(BUTTON_STATE_TOKENS));
  const states: ButtonState[] = ["default", "hover", "pressed"];
  const geo = BUTTON_SIZES.md;
  const scenes: FrameScene[] = [];
  for (const variant of variants as ButtonVariant[]) {
    for (const state of states) {
      const t = BUTTON_STATE_TOKENS[variant][state];
      const stroke = BUTTON_VARIANTS[variant].stroke;
      scenes.push({
        k: "frame",
        name: `variant=${variant}, state=${state}`,
        layout: "HORIZONTAL",
        primaryAlign: "CENTER",
        counterAlign: "CENTER",
        gap: 8,
        padX: geo.padX,
        padY: 0,
        sizing: { primary: "AUTO", counter: "FIXED" },
        width: 120,
        height: px(bundle, geo.control),
        fill: t.bg,
        stroke,
        radius: "control/radius",
        children: [text("Button", "Inter", "Semi Bold", px(bundle, geo.font), t.text)],
      });
    }
  }
  return {
    name: "Button States",
    description:
      "Button hover and pressed states at the md size. Axes: variant (primary, secondary, soft, ghost, destructive) and state (default, hover, pressed). The base Button set has the size axis. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "grid", cols: states.length, gapX: 170, gapY: 64 },
    origin: { x: 700, y: 0 },
    scenes,
  };
}

function badgeDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const tones = contract.props.tone?.values;
  if (!tones) throw new Error("Badge contract must list tone");
  assertSameValues("Badge", "tone", tones, BADGE_TONES);
  const scenes: FrameScene[] = (tones as BadgeTone[]).map((tone) => ({
    k: "frame",
    name: `tone=${tone}`,
    layout: "HORIZONTAL",
    primaryAlign: "CENTER",
    counterAlign: "CENTER",
    gap: 0,
    padX: 10,
    padY: 2,
    sizing: { primary: "AUTO", counter: "AUTO" },
    width: 60,
    height: 19,
    fill: `badge/${tone}/bg`,
    radius: "radius/full",
    children: [text(tone.charAt(0).toUpperCase() + tone.slice(1), "Inter", "Semi Bold", px(bundle, "fontSize.xs"), `badge/${tone}/text`)],
  }));
  return {
    name: "Badge",
    description:
      "Short status label. Axis: tone (neutral, info, success, warning, error). The text states the status and the color supports it. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "grid", cols: tones.length, gapX: 120, gapY: 0 },
    origin: { x: 0, y: 560 },
    scenes,
  };
}

function inputDef(bundle: TokenBundle): ComponentDef {
  const scenes: FrameScene[] = INPUT_STATES.map((state: InputState) => {
    const hasValue = state === "filled" || state === "error";
    const isError = state === "error";
    return {
      k: "frame",
      name: `state=${state}`,
      layout: "VERTICAL",
      primaryAlign: "MIN",
      counterAlign: "MIN",
      gap: 4,
      padX: 0,
      padY: 0,
      sizing: { primary: "AUTO", counter: "FIXED" },
      width: 320,
      height: 80,
      children: [
        text("Label", "Inter", "Medium", px(bundle, "fontSize.sm"), "input/label"),
        {
          k: "frame",
          name: "Field",
          layout: "HORIZONTAL",
          primaryAlign: "MIN",
          counterAlign: "CENTER",
          gap: 0,
          padX: 12,
          padY: 0,
          sizing: { primary: "FIXED", counter: "FIXED" },
          width: 320,
          height: px(bundle, "control.lg"),
          fill: "input/bg",
          stroke: isError ? "input/border-error" : state === "hover" ? "input/border-hover" : "input/border",
          radius: "control/radius",
          children: [
            hasValue
              ? text("Value", "Inter", "Regular", px(bundle, "fontSize.md"), "input/text")
              : text("Placeholder", "Inter", "Regular", px(bundle, "fontSize.md"), "input/placeholder"),
          ],
        },
        isError
          ? text("Error message", "Inter", "Regular", px(bundle, "fontSize.sm"), "input/error-text")
          : text("Help text", "Inter", "Regular", px(bundle, "fontSize.sm"), "input/help"),
      ],
    };
  });
  return {
    name: "Input",
    description:
      "Text field with label, and help or error text. Axis: state (default, hover, filled, error). Hover is the interactive border. Focus is the global focus outline and disabled has no Input styling in code, so neither is a variant. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "stack", gap: 24 },
    origin: { x: 0, y: 720 },
    scenes,
  };
}

function cardDef(bundle: TokenBundle): ComponentDef {
  return {
    name: "Card",
    description:
      "Surface for grouping related content. Decorative border (border/subtle), card radius, and card shadow. No variants. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: false,
    layout: { kind: "stack", gap: 0 },
    origin: { x: 420, y: 720 },
    scenes: [
      {
        k: "frame",
        name: "Card",
        layout: "VERTICAL",
        primaryAlign: "MIN",
        counterAlign: "MIN",
        gap: 8,
        padX: 20,
        padY: 20,
        sizing: { primary: "AUTO", counter: "FIXED" },
        width: 320,
        height: 93,
        fill: "card/bg",
        stroke: "card/border",
        radius: "card/radius",
        effectStyle: "shadow/card",
        children: [
          text("Card title", "Inter", "Semi Bold", px(bundle, "fontSize.h4"), "text/primary"),
          text("Supporting copy for grouped content.", "Inter", "Regular", px(bundle, "fontSize.md"), "text/secondary"),
        ],
      },
    ],
  };
}

type HeadingLevel = "1" | "2" | "3" | "4";

/** Text styles for each heading level. Brand (Sora) exists only at levels 1 and 2, as in Heading.tsx. */
const HEADING_STYLES: Record<HeadingLevel, { ui: string; brand?: string }> = {
  "1": { ui: "Type/UI/h1", brand: "Type/Brand/h1" },
  "2": { ui: "Type/UI/h2", brand: "Type/Brand/h2" },
  "3": { ui: "Type/UI/h3" },
  "4": { ui: "Type/UI/h4" },
};

/** Heading: level × brand, with brand only where the code allows it. Heading.tsx throws for brand at level 3 or 4. */
function headingDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const levels = contract.props.level?.values;
  const brands = contract.props.brand?.values;
  if (!levels || !brands) throw new Error("Heading contract must list level and brand");
  assertSameValues("Heading", "level", levels, Object.keys(HEADING_STYLES));
  assertSameValues("Heading", "brand", brands, ["false", "true"]);
  const scenes: FrameScene[] = [];
  for (const level of levels as HeadingLevel[]) {
    for (const brand of ["false", "true"] as const) {
      const style = HEADING_STYLES[level];
      if (brand === "true" && !style.brand) continue;
      const isBrand = brand === "true";
      scenes.push({
        k: "frame",
        name: `level=${level}, brand=${brand}`,
        layout: "VERTICAL",
        primaryAlign: "MIN",
        counterAlign: "MIN",
        gap: 0,
        padX: 0,
        padY: 0,
        sizing: { primary: "AUTO", counter: "AUTO" },
        width: 320,
        height: 40,
        children: [
          {
            ...text("Heading", isBrand ? "Sora" : "Inter", isBrand ? "ExtraBold" : "Semi Bold", px(bundle, `fontSize.h${level}`), "text/primary"),
            textStyle: isBrand ? style.brand : style.ui,
          },
        ],
      });
    }
  }
  return {
    name: "Heading",
    description:
      "Section heading. Axes: level (1 to 4) and brand (true only at levels 1 and 2). Brand uses the Sora brand face. The size prop is code-only: Figma shows each level at its own size. Level 1 uses the desktop size; the phone size (h1-mobile) is not drawn. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "stack", gap: 24 },
    origin: { x: 0, y: 1600 },
    scenes,
  };
}

/** Text roles, each with the text style and color the role uses in Text.tsx. */
const TEXT_ROLES: Record<string, { style: string; family: FontFamily; fontStyle: FontStyle; size: string; fill: string }> = {
  lead: { style: "Type/UI/lg", family: "Inter", fontStyle: "Regular", size: "fontSize.lg", fill: "text/primary" },
  body: { style: "Type/UI/md", family: "Inter", fontStyle: "Regular", size: "fontSize.md", fill: "text/primary" },
  label: { style: "Type/UI/label", family: "Inter", fontStyle: "Medium", size: "fontSize.sm", fill: "text/primary" },
  helper: { style: "Type/UI/sm", family: "Inter", fontStyle: "Regular", size: "fontSize.sm", fill: "text/muted" },
  meta: { style: "Type/UI/xs", family: "Inter", fontStyle: "Regular", size: "fontSize.xs", fill: "text/muted" },
};

function textDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const roles = contract.props.role?.values;
  if (!roles) throw new Error("Text contract must list role");
  assertSameValues("Text", "role", roles, Object.keys(TEXT_ROLES));
  const scenes: FrameScene[] = roles.map((role) => {
    const r = TEXT_ROLES[role];
    return {
      k: "frame",
      name: `role=${role}`,
      layout: "VERTICAL",
      primaryAlign: "MIN",
      counterAlign: "MIN",
      gap: 0,
      padX: 0,
      padY: 0,
      sizing: { primary: "AUTO", counter: "AUTO" },
      width: 320,
      height: 24,
      children: [{ ...text("Body copy sample.", r.family, r.fontStyle, px(bundle, r.size), r.fill), textStyle: r.style }],
    };
  });
  return {
    name: "Text",
    description:
      "Body copy by role: lead, body, label, helper, meta. Axis: role. Each role uses its text style and color from the type scale. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "stack", gap: 16 },
    origin: { x: 500, y: 1600 },
    scenes,
  };
}

/** Toggle track and thumb. The label is the caller's content, so it is not part of the component. */
function toggleDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const states = ["off", "on", "disabled"];
  for (const s of states) {
    if (!(contract.states ?? []).includes(s)) throw new Error(`Toggle contract is missing state ${s}`);
  }
  const scenes: FrameScene[] = states.map((state) => {
    const on = state === "on";
    return {
      k: "frame",
      name: `state=${state}`,
      layout: "NONE",
      primaryAlign: "MIN",
      counterAlign: "MIN",
      gap: 0,
      padX: 0,
      padY: 0,
      sizing: { primary: "FIXED", counter: "FIXED" },
      width: 44,
      height: 24,
      fill: on ? "toggle/track-on-bg" : "toggle/track-off-bg",
      stroke: on ? "toggle/track-on-border" : "toggle/track-off-border",
      radius: "toggle/radius",
      opacity: state === "disabled" ? 0.5 : undefined,
      children: [
        { k: "ellipse", name: "Thumb", width: 16, height: 16, fill: on ? "toggle/thumb-on" : "toggle/thumb-off", x: on ? 24 : 4, y: 4 },
      ],
    };
  });
  return {
    name: "Toggle",
    description:
      "On and off switch track with its thumb. Axis: state (off, on, disabled). Disabled is the off look at half opacity. Focus is the global focus outline. The label belongs to the caller, so it is not drawn. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "grid", cols: states.length, gapX: 90, gapY: 0 },
    origin: { x: 500, y: 1900 },
    scenes,
  };
}

/** Divider in horizontal and vertical orientation, subtle and strong weight. */
function dividerDef(contract: ContractFile): ComponentDef {
  const orientations = contract.props.orientation?.values;
  const weights = contract.props.weight?.values;
  if (!orientations || !weights) throw new Error("Divider contract must list orientation and weight");
  const scenes: FrameScene[] = [];
  for (const orientation of orientations) {
    for (const weight of weights) {
      const horizontal = orientation === "horizontal";
      scenes.push({
        k: "frame",
        name: `orientation=${orientation}, weight=${weight}`,
        layout: "NONE",
        primaryAlign: "MIN",
        counterAlign: "MIN",
        gap: 0,
        padX: 0,
        padY: 0,
        sizing: { primary: "FIXED", counter: "FIXED" },
        width: horizontal ? 320 : 1,
        height: horizontal ? 1 : 80,
        fill: `divider/${weight}`,
        children: [],
      });
    }
  }
  return {
    name: "Divider",
    description:
      "Separator. Axes: orientation (horizontal, vertical) and weight (subtle is decorative, strong marks a structural boundary). Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "grid", cols: weights.length, gapX: 360, gapY: 100 },
    origin: { x: 900, y: 1900 },
    scenes,
  };
}

/** Skeleton shapes at the sizes their code classes use: h-4, h-40, aspect-video on a 320px column, and h-12. */
const SKELETON_SHAPES: Record<"text" | "card" | "image" | "row", { height: number; radius?: string }> = {
  text: { height: 16, radius: "radius/sm" },
  card: { height: 160, radius: "radius/lg" },
  image: { height: 180, radius: "radius/lg" },
  row: { height: 48 },
};

function skeletonDef(contract: ContractFile): ComponentDef {
  const variants = contract.props.variant?.values;
  if (!variants) throw new Error("Skeleton contract must list variant");
  assertSameValues("Skeleton", "variant", variants, Object.keys(SKELETON_SHAPES));
  const scenes: FrameScene[] = (variants as (keyof typeof SKELETON_SHAPES)[]).map((variant) => {
    const shape = SKELETON_SHAPES[variant];
    return {
      k: "frame",
      name: `variant=${variant}`,
      layout: "NONE",
      primaryAlign: "MIN",
      counterAlign: "MIN",
      gap: 0,
      padX: 0,
      padY: 0,
      sizing: { primary: "FIXED", counter: "FIXED" },
      width: 320,
      height: shape.height,
      fill: "skeleton/bg",
      fillOpacity: 0.5,
      radius: shape.radius,
      children: [],
    };
  });
  return {
    name: "Skeleton",
    description:
      "Loading placeholder shaped like the content it stands in for. Axis: variant (text, card, image, row). Drawn at half opacity of border/subtle, as in Skeleton.tsx. The pulse animation is code-only. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "stack", gap: 16 },
    origin: { x: 0, y: 2200 },
    scenes,
  };
}

const TONES = ["info", "success", "warning", "error"] as const;
type Tone = (typeof TONES)[number];

/** Alert and Toast share the tone axis. Both use the tone's surface or edge, and text.primary for copy. */
function alertDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const tones = contract.props.tone?.values;
  if (!tones) throw new Error("Alert contract must list tone");
  assertSameValues("Alert", "tone", tones, TONES);
  const scenes: FrameScene[] = (tones as Tone[]).map((tone) => ({
    k: "frame",
    name: `tone=${tone}`,
    layout: "VERTICAL",
    primaryAlign: "MIN",
    counterAlign: "MIN",
    gap: 4,
    padX: 16,
    padY: 16,
    sizing: { primary: "AUTO", counter: "FIXED" },
    width: 360,
    height: 60,
    fill: `alert/${tone}/bg`,
    stroke: `alert/${tone}/border`,
    radius: "alert/radius",
    children: [
      text("Title", "Inter", "Semi Bold", px(bundle, "fontSize.md"), "alert/text"),
      text("Message text.", "Inter", "Regular", px(bundle, "fontSize.sm"), "alert/text"),
    ],
  }));
  return {
    name: "Alert",
    description:
      "Inline message with a title and text. Axis: tone (info, success, warning, error). Shown here with a 1px tone border. The code uses a 4px left edge and an icon, which Figma does not draw. Error alerts use role=alert in code. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "stack", gap: 16 },
    origin: { x: 0, y: 1120 },
    scenes,
  };
}

function toastDef(bundle: TokenBundle, contract: ContractFile): ComponentDef {
  const tones = contract.props.tone?.values;
  if (!tones) throw new Error("Toast contract must list tone");
  assertSameValues("Toast", "tone", tones, TONES);
  const scenes: FrameScene[] = (tones as Tone[]).map((tone) => ({
    k: "frame",
    name: `tone=${tone}`,
    layout: "HORIZONTAL",
    primaryAlign: "MIN",
    counterAlign: "MIN",
    gap: 12,
    padX: 16,
    padY: 16,
    sizing: { primary: "FIXED", counter: "AUTO" },
    width: 360,
    height: 60,
    fill: "toast/bg",
    stroke: `toast/${tone}/border`,
    radius: "toast/radius",
    effectStyle: "shadow/popover",
    children: [
      {
        k: "frame",
        name: "Content",
        layout: "VERTICAL",
        primaryAlign: "MIN",
        counterAlign: "MIN",
        gap: 4,
        padX: 0,
        padY: 0,
        sizing: { primary: "AUTO", counter: "FIXED" },
        width: 300,
        height: 40,
        children: [
          text("Title", "Inter", "Semi Bold", px(bundle, "fontSize.md"), "toast/text"),
          text("Message text.", "Inter", "Regular", px(bundle, "fontSize.sm"), "toast/text"),
        ],
      },
      text("×", "Inter", "Regular", px(bundle, "fontSize.lg"), "toast/text"),
    ],
  }));
  return {
    name: "Toast",
    description:
      "Short non-blocking message with a dismiss control. Axis: tone (info, success, warning, error). Shown as a resting toast with a popover shadow. Auto-dismiss and the visible and dismissed states are code behavior, not Figma variants. Synced from web/design-system/figma/components.ts. Edit the code, not this file.",
    isSet: true,
    layout: { kind: "stack", gap: 16 },
    origin: { x: 440, y: 1120 },
    scenes,
  };
}

function text(characters: string, family: FontFamily, style: FontStyle, size: number, fill: string): TextScene {
  return { k: "text", characters, family, style, size, fill };
}

export interface ComponentContracts {
  button: ContractFile;
  badge: ContractFile;
  alert: ContractFile;
  toast: ContractFile;
  heading: ContractFile;
  text: ContractFile;
  toggle: ContractFile;
  divider: ContractFile;
  skeleton: ContractFile;
}

export function buildComponentDefs(bundle: TokenBundle, contracts: ComponentContracts): ComponentDef[] {
  return [
    buttonDef(bundle, contracts.button),
    buttonStatesDef(bundle, contracts.button),
    badgeDef(bundle, contracts.badge),
    inputDef(bundle),
    cardDef(bundle),
    alertDef(bundle, contracts.alert),
    toastDef(bundle, contracts.toast),
    headingDef(bundle, contracts.heading),
    textDef(bundle, contracts.text),
    toggleDef(bundle, contracts.toggle),
    dividerDef(contracts.divider),
    skeletonDef(contracts.skeleton),
  ];
}
