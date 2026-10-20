// Types for the Figma mirror. The payload built from the token JSON, the scripts sent to Figma,
// and the snapshot read back from Figma all use these shapes. Nothing here runs in Figma.

export const COLLECTIONS = ["Primitives", "Semantic", "Component"] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

/** Single mode per collection (the app has one light theme). */
export const MODE_NAMES: Record<CollectionName, string> = {
  Primitives: "Value",
  Semantic: "Light",
  Component: "Value",
};

export const FIGMA_SCOPES = [
  "FRAME_FILL",
  "SHAPE_FILL",
  "TEXT_FILL",
  "STROKE_COLOR",
  "CORNER_RADIUS",
  "WIDTH_HEIGHT",
  "FONT_SIZE",
] as const;
export type FigmaScope = (typeof FIGMA_SCOPES)[number];

export type VariableType = "COLOR" | "FLOAT" | "STRING";

/** `alias` points at another variable by its Figma name, so the payload never duplicates a raw value. */
export type VariableValue =
  | { kind: "color"; hex: string }
  | { kind: "float"; number: number }
  | { kind: "string"; text: string }
  | { kind: "alias"; target: string };

export interface VariableSpec {
  name: string;
  collection: CollectionName;
  type: VariableType;
  scopes: FigmaScope[];
  /** WEB code syntax, for example var(--color-text-primary). Set only for tokens that exist as CSS variables. */
  codeSyntax?: string;
  value: VariableValue;
}

export type FontFamily = "Inter" | "Sora";
export type FontStyle = "Regular" | "Medium" | "Semi Bold" | "ExtraBold";

export interface TextStyleSpec {
  name: string;
  family: FontFamily;
  style: FontStyle;
  size: number;
  lineHeight: number;
}

export interface ShadowEffect {
  type: "DROP_SHADOW";
  color: { r: number; g: number; b: number; a: number };
  offset: { x: number; y: number };
  radius: number;
  spread: number;
}

export interface EffectStyleSpec {
  name: string;
  effects: ShadowEffect[];
}

export interface Foundations {
  variables: VariableSpec[];
  textStyles: TextStyleSpec[];
  effectStyles: EffectStyleSpec[];
}

/**
 * A frame in a component scene. Token references are Figma variable names.
 * Layout NONE means absolute positioning: children use x and y, and sizing and padding are ignored.
 */
export interface FrameScene {
  k: "frame";
  name: string;
  layout: "HORIZONTAL" | "VERTICAL" | "NONE";
  /** Position inside a NONE-layout parent. */
  x?: number;
  y?: number;
  /** Node opacity (0 to 1), for disabled states. */
  opacity?: number;
  /** Opacity of the fill paint, for tokens that are a fraction of a color (for example, skeleton). */
  fillOpacity?: number;
  primaryAlign: "MIN" | "CENTER";
  counterAlign: "MIN" | "CENTER";
  gap: number;
  padX: number;
  padY: number;
  sizing: { primary: "AUTO" | "FIXED"; counter: "AUTO" | "FIXED" };
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  radius?: string;
  effectStyle?: string;
  children: SceneNode[];
}

export interface TextScene {
  k: "text";
  characters: string;
  family: FontFamily;
  style: FontStyle;
  size: number;
  fill: string;
  /** Name of a text style in the foundations. Applied after the font, so the style wins for font and size. */
  textStyle?: string;
  x?: number;
  y?: number;
}

/** A filled circle, used for the toggle thumb. */
export interface EllipseScene {
  k: "ellipse";
  name: string;
  width: number;
  height: number;
  fill: string;
  x: number;
  y: number;
}

export type SceneNode = FrameScene | TextScene | EllipseScene;

export type ComponentLayout = { kind: "grid"; cols: number; gapX: number; gapY: number } | { kind: "stack"; gap: number };

export interface ComponentDef {
  /** Figma node name. Also the name the sync replaces on rerun. */
  name: string;
  description: string;
  /** Variant sets have one scene per variant. A single component has one scene. */
  isSet: boolean;
  layout: ComponentLayout;
  origin: { x: number; y: number };
  scenes: FrameScene[];
}

export interface FigmaPayload {
  foundations: Foundations;
  components: ComponentDef[];
  pageName: string;
}
