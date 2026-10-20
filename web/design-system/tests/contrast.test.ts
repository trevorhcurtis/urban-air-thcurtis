import { describe, expect, it } from "vitest";
import { loadTokens, resolvedColors } from "../resolve.mjs";

// WCAG 2.x relative luminance and contrast ratio, computed from resolved hex values.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const colors = resolvedColors(loadTokens());
const c = (path: string) => {
  const value = colors[`color.${path}`];
  if (!value) throw new Error(`Missing token color.${path}`);
  return value;
};

const TEXT_TOKENS = ["text.primary", "text.secondary", "text.muted", "text.link", "text.accent", "text.success", "text.warning", "text.error", "text.info"];
const CANVAS_SURFACES = ["surface.canvas", "surface.subtle", "surface.muted", "surface.brand"];

describe("text on light surfaces meets 4.5:1", () => {
  for (const text of TEXT_TOKENS) {
    for (const surface of CANVAS_SURFACES) {
      it(`${text} on ${surface}`, () => {
        expect(contrast(c(text), c(surface))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

// Soft buttons hover to brand-hover, which carries navy text only. Links and accent green are never placed there (measured 4.47 and 4.28).
describe("navy text on the soft-button hover surface meets 4.5:1", () => {
  for (const text of ["text.primary", "text.secondary", "text.muted"]) {
    it(`${text} on surface.brand-hover`, () => {
      expect(contrast(c(text), c("surface.brand-hover"))).toBeGreaterThanOrEqual(4.5);
    });
  }
  it("text.link is below 4.5:1 on surface.brand-hover, so the ghost button hovers to surface.brand instead", () => {
    expect(contrast(c("text.link"), c("surface.brand-hover"))).toBeLessThan(4.5);
  });
});

describe("text on solid and dark surfaces meets 4.5:1", () => {
  const onDark: [string, string][] = [
    ["text.inverse", "surface.inverse"],
    ["text.inverse", "surface.interactive"],
    ["text.inverse", "surface.interactive-hover"],
    ["text.inverse", "surface.destructive"],
    ["text.inverse", "surface.destructive-hover"],
    ["text.inverse", "solid.success"],
    ["text.inverse", "solid.warning"],
    ["text.inverse", "solid.error"],
    ["text.inverse", "solid.info"],
    ["text.onAccent", "surface.accent"],
  ];
  for (const [text, surface] of onDark) {
    it(`${text} on ${surface}`, () => {
      expect(contrast(c(text), c(surface))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("status text on its own surface meets 4.5:1", () => {
  for (const status of ["success", "warning", "error", "info"]) {
    it(`${status} text on ${status} surface`, () => {
      expect(contrast(c(`text.${status}`), c(`surface.${status}`))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("the approved pairings in the guidance still hold", () => {
  const approved: [string, string, number][] = [
    ["text.primary", "surface.canvas", 13.1],
    ["text.link", "surface.canvas", 5.5],
    ["text.inverse", "surface.inverse", 13.1],
    ["text.inverse", "surface.interactive", 5.5],
    ["text.primary", "surface.accent", 6.0],
    ["text.primary", "surface.brand", 11.7],
    ["text.secondary", "surface.canvas", 7.5],
    ["text.secondary", "surface.brand", 6.7],
  ];
  for (const [text, surface, expected] of approved) {
    it(`${text} on ${surface} is at least ${expected}:1`, () => {
      expect(contrast(c(text), c(surface))).toBeGreaterThanOrEqual(expected);
    });
  }
});

// Pressed button states. Each pressed surface is one step darker than its hover surface, and its text must still pass.
describe("pressed button states meet 4.5:1", () => {
  const pressed: [string, string][] = [
    ["text.inverse", "surface.interactive-pressed"],
    ["text.inverse", "surface.destructive-pressed"],
    ["text.primary", "surface.brand-pressed"],
    ["text.primary", "surface.brand-hover"],
    ["text.link-pressed", "surface.brand-hover"],
  ];
  for (const [text, surface] of pressed) {
    it(`${text} on ${surface}`, () => {
      expect(contrast(c(text), c(surface))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("non-text boundaries and focus meet 3:1", () => {
  const boundaries: [string, string][] = [
    ["border.default", "surface.canvas"],
    ["border.default", "surface.subtle"],
    ["border.focus", "surface.canvas"],
    ["border.focus", "surface.brand"],
    ["border.interactive", "surface.canvas"],
    ["border.brand", "surface.canvas"],
    ["solid.error", "surface.canvas"],
    ["solid.success", "surface.canvas"],
  ];
  for (const [border, surface] of boundaries) {
    it(`${border} on ${surface}`, () => {
      expect(contrast(c(border), c(surface))).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("named component states", () => {
  it("selected chip: inverse text on the interactive surface", () => {
    expect(contrast(c("text.inverse"), c("surface.interactive"))).toBeGreaterThanOrEqual(4.5);
  });
  it("field error message: error text on the canvas", () => {
    expect(contrast(c("text.error"), c("surface.canvas"))).toBeGreaterThanOrEqual(4.5);
  });
  it("selected card or tile edge: interactive border on the canvas", () => {
    expect(contrast(c("border.interactive"), c("surface.canvas"))).toBeGreaterThanOrEqual(3);
  });
});

describe("policy: tokens that must not carry text", () => {
  it("bright decorative blue is below 4.5:1 on white, so it is decorative only", () => {
    expect(contrast(c("decorative.blue-bright"), c("surface.canvas"))).toBeLessThan(4.5);
  });

  it("subtle border is below 3:1 on white, so it is decorative only", () => {
    expect(contrast(c("border.subtle"), c("surface.canvas"))).toBeLessThan(3);
  });
});
