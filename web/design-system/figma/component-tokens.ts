// Component-level tokens. Each one aliases a semantic or primitive variable. The names match the
// Component collection already in the Figma file, so a sync updates those variables in place.

import type { FigmaScope } from "./types.ts";

export interface ComponentTokenSpec {
  /** Name of the semantic or primitive variable this token aliases. */
  target: string;
  scopes: FigmaScope[];
}

const bg = (target: string): ComponentTokenSpec => ({ target, scopes: ["FRAME_FILL"] });
const text = (target: string): ComponentTokenSpec => ({ target, scopes: ["TEXT_FILL"] });
const border = (target: string): ComponentTokenSpec => ({ target, scopes: ["STROKE_COLOR"] });
const radius = (target: string): ComponentTokenSpec => ({ target, scopes: ["CORNER_RADIUS"] });

export const COMPONENT_TOKENS = {
  "button/primary/bg": bg("surface/interactive"),
  "button/primary/bg-hover": bg("surface/interactive-hover"),
  "button/primary/bg-pressed": bg("surface/interactive-pressed"),
  "button/primary/text": text("text/inverse"),
  "button/secondary/bg": bg("surface/canvas"),
  "button/secondary/bg-hover": bg("surface/brand"),
  "button/secondary/border": border("border/brand"),
  "button/secondary/text": text("text/primary"),
  "button/soft/bg": bg("surface/brand"),
  "button/soft/text": text("text/primary"),
  "button/ghost/text": text("text/link"),
  "button/destructive/bg": bg("surface/destructive"),
  "button/destructive/bg-hover": bg("surface/destructive-hover"),
  "button/destructive/bg-pressed": bg("surface/destructive-pressed"),
  "button/destructive/text": text("text/inverse"),
  "input/bg": bg("surface/canvas"),
  "input/border": border("border/default"),
  "input/border-hover": border("border/interactive"),
  "input/border-error": border("solid/error"),
  "input/text": text("text/primary"),
  "input/placeholder": text("text/muted"),
  "input/label": text("text/primary"),
  "input/help": text("text/muted"),
  "input/error-text": text("text/error"),
  "card/bg": bg("surface/canvas"),
  "card/border": border("border/subtle"),
  "card/radius": radius("radius/lg"),
  "badge/neutral/bg": bg("surface/brand"),
  "badge/neutral/text": text("text/primary"),
  "badge/info/bg": bg("surface/info"),
  "badge/info/text": text("text/info"),
  "badge/success/bg": bg("surface/success"),
  "badge/success/text": text("text/success"),
  "badge/warning/bg": bg("surface/warning"),
  "badge/warning/text": text("text/warning"),
  "badge/error/bg": bg("surface/error"),
  "badge/error/text": text("text/error"),
  "control/radius": radius("radius/md"),
  "alert/info/bg": bg("surface/info"),
  "alert/info/border": border("solid/info"),
  "alert/success/bg": bg("surface/success"),
  "alert/success/border": border("solid/success"),
  "alert/warning/bg": bg("surface/warning"),
  "alert/warning/border": border("solid/warning"),
  "alert/error/bg": bg("surface/error"),
  "alert/error/border": border("solid/error"),
  "alert/text": text("text/primary"),
  "alert/radius": radius("radius/md"),
  "toast/bg": bg("surface/canvas"),
  "toast/info/border": border("solid/info"),
  "toast/success/border": border("solid/success"),
  "toast/warning/border": border("solid/warning"),
  "toast/error/border": border("solid/error"),
  "toast/text": text("text/primary"),
  "toast/radius": radius("radius/md"),
  "button/secondary/bg-pressed": bg("surface/brand-hover"),
  "button/soft/bg-hover": bg("surface/brand-hover"),
  "button/soft/bg-pressed": bg("surface/brand-pressed"),
  "button/ghost/bg-hover": bg("surface/brand"),
  "button/ghost/bg-pressed": bg("surface/brand-hover"),
  "button/ghost/text-pressed": text("text/link-pressed"),
  "toggle/track-off-bg": bg("surface/canvas"),
  "toggle/track-off-border": border("border/default"),
  "toggle/track-on-bg": bg("surface/interactive"),
  "toggle/track-on-border": border("border/interactive"),
  "toggle/thumb-off": bg("border/default"),
  "toggle/thumb-on": bg("surface/canvas"),
  "toggle/radius": radius("radius/full"),
  "divider/subtle": bg("border/subtle"),
  "divider/strong": bg("border/default"),
  "skeleton/bg": bg("border/subtle"),
} satisfies Record<string, ComponentTokenSpec>;

export type ComponentTokenName = keyof typeof COMPONENT_TOKENS;
