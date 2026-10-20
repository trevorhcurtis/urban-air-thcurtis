import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCss, buildResolvedJson, OUTPUT, RESOLVED_OUTPUT } from "../build-tokens.mjs";
import { buildTokens, loadTokens } from "../resolve.mjs";

const WEB_ROOT = join(__dirname, "..", "..");
const SCAN_ROOTS = ["app", "components"].map((d) => join(WEB_ROOT, d));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const FILES = SCAN_ROOTS.flatMap(sourceFiles).map((path) => ({ path: relative(WEB_ROOT, path), text: readFileSync(path, "utf8") }));

// Class prefixes that take a color, and the token names each may use (see tokens.generated.css).
const COLOR_PREFIXES = ["text", "bg", "border", "ring", "outline", "fill", "stroke", "placeholder", "decoration", "accent"];
const SIZE_NAMES = new Set(["xs", "sm", "md", "lg", "h1", "h1-mobile", "h2", "h3", "h4", "display"]);
const NON_COLOR_FIRST_SEGMENTS = new Set([
  "left", "center", "right", "justify", "start", "end", "wrap", "nowrap", "balance", "pretty", "ellipsis", "clip",
  "t", "b", "l", "r", "x", "y", "s", "e", "0", "1", "2", "4", "8", "solid", "dashed", "dotted", "none", "transparent",
  "cover", "contain", "repeat", "no", "collapse", "separate", "current", "opacity", "inset", "offset",
]);

function colorTokenNames(): Set<string> {
  const tokens = loadTokens();
  return new Set(Object.keys(tokens.semantic).map((path) => path.replace(/^color\./, "").replace(/\./g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()));
}

describe("generated token CSS", () => {
  it("is up to date with the token source (run pnpm run tokens to fix)", () => {
    expect(readFileSync(OUTPUT, "utf8")).toBe(buildCss());
  });

  it("resolved color JSON is up to date", () => {
    expect(readFileSync(RESOLVED_OUTPUT, "utf8")).toBe(buildResolvedJson());
  });

  it("loads from the committed token files without errors", () => {
    expect(() => loadTokens()).not.toThrow();
  });
});

describe("token validation rejects bad input", () => {
  const schema = JSON.parse(readFileSync(join(__dirname, "..", "schema", "tokens.schema.json"), "utf8"));
  const primitives = { color: { a: { $value: "#000000" } } };

  it("rejects a circular reference", () => {
    const semantic = { color: { x: { $value: "{color.y}" }, y: { $value: "{color.x}" } } };
    expect(() => buildTokens({ primitives, semantic, theme: {} }, schema)).toThrow(/Circular reference/);
  });

  it("rejects a reference to a missing token", () => {
    const semantic = { color: { x: { $value: "{color.missing}" } } };
    expect(() => buildTokens({ primitives, semantic, theme: {} }, schema)).toThrow(/Unresolved/);
  });

  it("rejects a raw value in the semantic layer", () => {
    const semantic = { color: { x: { $value: "#FFFFFF" } } };
    expect(() => buildTokens({ primitives, semantic, theme: {} }, schema)).toThrow(/must reference a primitive/);
  });

  it("rejects a reference inside the primitive layer", () => {
    const badPrimitives = { color: { a: { $value: "{color.b}" }, b: { $value: "#000000" } } };
    expect(() => buildTokens({ primitives: badPrimitives, semantic: {}, theme: {} }, schema)).toThrow(/must be a raw value/);
  });

  it("rejects a leaf with an unknown property", () => {
    const badSemantic = { color: { x: { $value: "{color.a}", $oops: true } } };
    expect(() => buildTokens({ primitives, semantic: badSemantic, theme: {} }, schema)).toThrow(/does not match the token schema/);
  });
});

// Semantic tokens that deliberately share a value. Each group is one meaning per role, reviewed on purpose.
// A new shared value fails the test below until it is added here with a reason.
const APPROVED_SHARED_VALUES: string[][] = [
  ["border.brand", "decorative.navy", "surface.inverse", "text.onAccent", "text.primary"], // brand navy
  ["border.focus", "border.interactive", "surface.interactive", "text.link"], // interactive blue
  ["decorative.green", "surface.accent"], // flight green
  ["surface.canvas", "text.inverse"], // white
  ["text.muted", "text.secondary"], // slate for secondary text and metadata
  ["solid.error", "surface.destructive", "text.error"], // error red
  ["surface.interactive-hover", "text.link-pressed"], // blue 700: button hover surface and ghost pressed text
];

describe("token meanings are not duplicated by accident", () => {
  it("every group of semantic tokens with the same value is approved", () => {
    const tokens = loadTokens() as unknown as { semantic: Record<string, unknown>; resolved: Record<string, { value: string }> };
    const byValue = new Map<string, string[]>();
    for (const path of Object.keys(tokens.semantic)) {
      const value = tokens.resolved[path].value;
      const name = path.replace(/^color\./, "");
      byValue.set(value, [...(byValue.get(value) ?? []), name]);
    }
    const groups = [...byValue.values()].filter((g) => g.length > 1).map((g) => [...g].sort().join(","));
    const approved = APPROVED_SHARED_VALUES.map((g) => [...g].sort().join(","));
    for (const group of groups) {
      expect(approved, `unapproved shared value: ${group}`).toContain(group);
    }
  });
});

describe("components use tokens, not raw values", () => {
  it("uses no arbitrary values in class names (variants such as aria-[...] are allowed)", () => {
    // Arbitrary values like text-[11px] or grid-cols-[auto_1fr] bypass the tokens. Layout values belong in theme.json.
    const offenders = FILES.flatMap(({ path, text }) =>
      [...text.matchAll(/(?<![\w-])([a-z][a-z0-9-]*)-\[[^\]]+\]/g)]
        .map((m) => m[1])
        .filter((prefix) => !["aria", "data", "supports", "group", "peer"].includes(prefix))
        .map((prefix) => `${path}: ${prefix}-[...]`),
    );
    expect([...new Set(offenders)]).toEqual([]);
  });


  it("contains no hex colors outside the token files", () => {
    const offenders = FILES.flatMap(({ path, text }) => {
      const matches = text.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g) ?? [];
      return matches.length ? [`${path}: ${matches.join(", ")}`] : [];
    });
    expect(offenders).toEqual([]);
  });

  it("the utility scanner finds real utilities in the source", () => {
    const count = FILES.reduce((n, { text }) => n + (text.match(/(?<![\w-])(text|bg|border)-(text|surface|solid|border)-[a-z]/g) ?? []).length, 0);
    expect(count).toBeGreaterThan(50);
  });

  it("uses only defined color utilities", () => {
    const allowed = colorTokenNames();
    const offenders: string[] = [];
    const pattern = new RegExp(`(?<![\\w-])(${COLOR_PREFIXES.join("|")})-([a-z][a-z0-9-]*(?:\\/[0-9]+)?)`, "g");

    for (const { path, text } of FILES) {
      for (const match of text.matchAll(pattern)) {
        const [, prefix, rawSuffix] = match;
        // Side and width modifiers (border-l-solid-error, border-t-2) are stripped before the color is checked.
        const withoutSide = rawSuffix.replace(/^(?:[trblxyse]-)(?=[a-z])/, "");
        const suffix = withoutSide.replace(/\/[0-9]+$/, "");
        const first = suffix.split("-")[0];
        if (NON_COLOR_FIRST_SEGMENTS.has(first)) continue;
        if (prefix === "text" && SIZE_NAMES.has(suffix)) continue;
        if (allowed.has(suffix)) continue;
        offenders.push(`${path}: ${prefix}-${rawSuffix}`);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });
});
