// Builds the Figma foundations (variables, text styles, effect styles) from the token JSON.
// Every name, value, scope, and code syntax comes from the token files or from COMPONENT_TOKENS.

import { COMPONENT_TOKENS } from "./component-tokens.ts";
import type {
  EffectStyleSpec,
  FigmaScope,
  Foundations,
  TextStyleSpec,
  VariableSpec,
  VariableType,
  VariableValue,
} from "./types.ts";
import { hexToRgb, kebab, parseShadow, toMs, toPx } from "./units.ts";

/** One leaf of a flattened token file, as produced by design-system/resolve.mjs. */
export interface TokenLeaf {
  value: string;
  lineHeight?: string;
}

export interface TokenBundle {
  primitives: Record<string, TokenLeaf>;
  semantic: Record<string, TokenLeaf>;
  theme: Record<string, TokenLeaf>;
}

const REFERENCE = /^\{([^}]+)\}$/;

/** "color.navy.900" -> "color/navy/900". Figma names mirror the token paths. */
export function figmaName(path: string): string {
  return path.split(".").join("/");
}

const SEMANTIC_SCOPES: Record<string, FigmaScope[]> = {
  text: ["TEXT_FILL"],
  surface: ["FRAME_FILL", "SHAPE_FILL"],
  solid: ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"],
  border: ["STROKE_COLOR"],
  decorative: ["FRAME_FILL", "SHAPE_FILL"],
};

function primitiveVariables(bundle: TokenBundle): VariableSpec[] {
  return Object.entries(bundle.primitives).map(([path, leaf]) => {
    const value = leaf.value;
    if (!path.startsWith("color.")) throw new Error(`Unexpected primitive group: ${path}`);
    return {
      name: figmaName(path),
      collection: "Primitives",
      type: "COLOR",
      scopes: [],
      value: { kind: "color", hex: value.toUpperCase() },
    };
  });
}

function semanticVariables(bundle: TokenBundle): VariableSpec[] {
  return Object.entries(bundle.semantic).map(([path, leaf]) => {
    const match = leaf.value.match(REFERENCE);
    if (!match) throw new Error(`Semantic token ${path} must reference a primitive`);
    const [group, ...rest] = path.split(".");
    if (group !== "color") throw new Error(`Unexpected semantic group: ${path}`);
    const scopes = SEMANTIC_SCOPES[rest[0]];
    if (!scopes) throw new Error(`No scope rule for semantic group "${rest[0]}" (${path})`);
    return {
      name: rest.join("/"),
      collection: "Semantic",
      type: "COLOR",
      scopes,
      codeSyntax: `var(--color-${rest.map(kebab).join("-")})`,
      value: { kind: "alias", target: figmaName(match[1]) },
    };
  });
}

function themeVariables(bundle: TokenBundle): VariableSpec[] {
  const out: VariableSpec[] = [];
  for (const [path, leaf] of Object.entries(bundle.theme)) {
    const [group, key] = path.split(".");
    if (path.startsWith("shadow.")) continue; // Shadows are effect styles, not variables.
    if (group === "font") {
      const family = leaf.value.match(/--font-(\w+)/)?.[1];
      if (!family) throw new Error(`Cannot read font family from ${path}`);
      out.push(stringVariable(`font/${key}`, family.charAt(0).toUpperCase() + family.slice(1), []));
    } else if (group === "fontSize") {
      out.push(floatVariable(`fontSize/${key}`, toPx(leaf.value), ["FONT_SIZE"]));
      if (!leaf.lineHeight) throw new Error(`fontSize.${key} has no line height`);
      out.push(floatVariable(`lineHeight/${key}`, toPx(leaf.lineHeight), []));
    } else if (group === "radius") {
      out.push(floatVariable(`radius/${key}`, toPx(leaf.value), ["CORNER_RADIUS"]));
    } else if (group === "control") {
      out.push(floatVariable(`control/${key}`, toPx(leaf.value), ["WIDTH_HEIGHT"]));
    } else if (group === "duration") {
      out.push(floatVariable(`duration/${key}`, toMs(leaf.value), []));
    } else if (group === "aspect") {
      out.push(stringVariable(`aspect/${key}`, leaf.value, []));
    } else if (group === "gridColumns") {
      out.push(stringVariable(`gridColumns/${key}`, leaf.value, []));
    } else {
      throw new Error(`No Figma mapping for theme token ${path}`);
    }
  }
  return out;
}

function floatVariable(name: string, number: number, scopes: FigmaScope[]): VariableSpec {
  return { name, collection: "Primitives", type: "FLOAT", scopes, value: { kind: "float", number } };
}

function stringVariable(name: string, text: string, scopes: FigmaScope[]): VariableSpec {
  return { name, collection: "Primitives", type: "STRING", scopes, value: { kind: "string", text } };
}

/** Component tokens alias semantic or primitive variables. Their type is copied from the target. */
function componentVariables(known: Map<string, VariableType>): VariableSpec[] {
  return Object.entries(COMPONENT_TOKENS).map(([name, spec]) => {
    const type = known.get(spec.target);
    if (!type) throw new Error(`Component token ${name} aliases unknown variable ${spec.target}`);
    return {
      name,
      collection: "Component" as const,
      type,
      scopes: spec.scopes,
      value: { kind: "alias", target: spec.target } satisfies VariableValue,
    };
  });
}

/** Text styles for each font size. Brand headings (Sora) get a second style, in the UI Inter style too. */
const BRAND_KEYS = ["h1", "h1-mobile", "h2", "display"] as const;

/** Text styles that are not a font size: the Text component's label role (Inter Medium, text-sm). */
const EXTRA_TEXT_STYLES: TextStyleSpec[] = [{ name: "Type/UI/label", family: "Inter", style: "Medium", size: 14, lineHeight: 20 }];
const SEMI_BOLD_KEYS = ["h1", "h1-mobile", "h2", "h3", "h4", "display"];

function textStyles(bundle: TokenBundle): TextStyleSpec[] {
  const out: TextStyleSpec[] = [];
  for (const [path, leaf] of Object.entries(bundle.theme)) {
    if (!path.startsWith("fontSize.")) continue;
    const key = path.slice("fontSize.".length);
    if (!leaf.lineHeight) throw new Error(`fontSize.${key} has no line height`);
    const size = toPx(leaf.value);
    const lineHeight = toPx(leaf.lineHeight);
    out.push({
      name: `Type/UI/${key}`,
      family: "Inter",
      style: SEMI_BOLD_KEYS.includes(key) ? "Semi Bold" : "Regular",
      size,
      lineHeight,
    });
    if ((BRAND_KEYS as readonly string[]).includes(key)) {
      out.push({ name: `Type/Brand/${key}`, family: "Sora", style: "ExtraBold", size, lineHeight });
    }
  }
  return out;
}

function effectStyles(bundle: TokenBundle): EffectStyleSpec[] {
  return Object.entries(bundle.theme)
    .filter(([path]) => path.startsWith("shadow."))
    .map(([path, leaf]) => ({ name: figmaName(path), effects: [parseShadow(leaf.value)] }));
}

export function buildFoundations(bundle: TokenBundle): Foundations {
  const base = [...primitiveVariables(bundle), ...themeVariables(bundle)];
  const semantic = semanticVariables(bundle);
  const known = new Map<string, VariableType>();
  for (const v of base) known.set(v.name, v.type);
  for (const v of semantic) known.set(v.name, v.type === "COLOR" ? targetType(v, known) : v.type);
  const component = componentVariables(known);
  return {
    variables: [...base, ...semantic, ...component].map(withRgbCheck),
    textStyles: [...textStyles(bundle), ...EXTRA_TEXT_STYLES],
    effectStyles: effectStyles(bundle),
  };
}

/** Semantic color aliases always point at a primitive color, so their type is COLOR. Kept as a function for clarity. */
function targetType(spec: VariableSpec, known: Map<string, VariableType>): VariableType {
  if (spec.value.kind !== "alias") return spec.type;
  return known.get(spec.value.target) ?? spec.type;
}

/** Fails early if a color payload value is not a usable hex color. */
function withRgbCheck(spec: VariableSpec): VariableSpec {
  if (spec.value.kind === "color") hexToRgb(spec.value.hex);
  return spec;
}
