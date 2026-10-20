// Converts the CSS values in the token files into the numbers Figma stores. Each parser throws on
// input it does not recognize, so an unexpected token value fails the build instead of syncing a wrong number.

import type { ShadowEffect } from "./types.ts";

const ROOT_FONT_PX = 16;

/** "2.75rem" -> 44, "4px" -> 4, "100ms" -> 100 (durations use ms, so they keep their number). */
export function toPx(raw: string): number {
  const rem = raw.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (rem) return Number(rem[1]) * ROOT_FONT_PX;
  const px = raw.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (px) return Number(px[1]);
  throw new Error(`Cannot convert "${raw}" to px`);
}

export function toMs(raw: string): number {
  const ms = raw.match(/^(\d+)ms$/);
  if (!ms) throw new Error(`Cannot convert "${raw}" to ms`);
  return Number(ms[1]);
}

const SHADOW = /^(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(\d+)(?:px)?\s+rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+(?:\.\d+)?)%\)$/;

/** "0 1px 3px rgb(11 45 107 / 8%)" -> one DROP_SHADOW effect with color channels in 0 to 1. */
export function parseShadow(raw: string): ShadowEffect {
  const m = raw.match(SHADOW);
  if (!m) throw new Error(`Cannot parse shadow "${raw}"`);
  const [, x, y, blur, r, g, b, alpha] = m;
  return {
    type: "DROP_SHADOW",
    color: { r: Number(r) / 255, g: Number(g) / 255, b: Number(b) / 255, a: Number(alpha) / 100 },
    offset: { x: Number(x), y: Number(y) },
    radius: Number(blur),
    spread: 0,
  };
}

/** "#0B2D6B" -> { r, g, b } in 0 to 1. Accepts only six-digit hex, which the token validator already enforces. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) throw new Error(`Not a six-digit hex color: ${hex}`);
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** Figma color channels in 0 to 1 -> "#RRGGBB". Used by the verifier to compare with the payload. */
export function rgbToHex(c: { r: number; g: number; b: number }): string {
  const ch = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${ch(c.r)}${ch(c.g)}${ch(c.b)}`.toUpperCase();
}

/** Turns a camelCase or dotted token segment into kebab case, matching the CSS names in app/tokens.generated.css. */
export function kebab(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
