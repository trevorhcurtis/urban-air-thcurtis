// Loads the design token files, validates them against the schema, and resolves references.
// Used by the CSS build (build-tokens.mjs) and by the contrast and token tests, so both see the same values.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const here = dirname(fileURLToPath(import.meta.url));
const FILES = { primitives: "tokens/primitives.json", semantic: "tokens/semantic.json", theme: "tokens/theme.json" };
const REFERENCE = /^\{([^}]+)\}$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;

function load(name) {
  return JSON.parse(readFileSync(join(here, name), "utf8"));
}

/** Flattens a token tree into { "color.text.primary": { value, ...meta } } for every leaf. */
export function flatten(tree, prefix = "", out = {}) {
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (node && typeof node === "object" && "$value" in node) {
      out[path] = { value: node.$value, lineHeight: node.$lineHeight, description: node.$description };
    } else {
      flatten(node, path, out);
    }
  }
  return out;
}

/** Follows {path} references until a raw value is reached. Throws on unknown or circular references. */
function resolveValue(path, flat, seen = []) {
  const entry = flat[path];
  if (!entry) throw new Error(`Unresolved reference chain at ${path}`);
  if (seen.includes(path)) throw new Error(`Circular reference: ${[...seen, path].join(" -> ")}`);
  const match = typeof entry.value === "string" ? entry.value.match(REFERENCE) : null;
  if (!match) return entry.value;
  return resolveValue(match[1], flat, [...seen, path]);
}

export function loadTokens() {
  const trees = Object.fromEntries(Object.entries(FILES).map(([k, file]) => [k, load(file)]));
  return buildTokens(trees, load("schema/tokens.schema.json"));
}

/** Validates and resolves token trees. Exported so tests can check that bad input is rejected. */
export function buildTokens(trees, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  const validate = ajv.compile(schema);
  for (const [name, tree] of Object.entries(trees)) {
    if (!validate(tree)) {
      const details = validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");
      throw new Error(`${FILES[name]} does not match the token schema: ${details}`);
    }
  }

  const primitives = flatten(trees.primitives);
  const semantic = flatten(trees.semantic);
  const theme = flatten(trees.theme);

  // Primitives hold raw values only. Semantic colors hold references only, so raw values can't sneak into components.
  for (const [path, entry] of Object.entries(primitives)) {
    if (typeof entry.value === "string" && REFERENCE.test(entry.value)) throw new Error(`Primitive ${path} must be a raw value`);
  }
  for (const [path, entry] of Object.entries(semantic)) {
    if (!(typeof entry.value === "string" && REFERENCE.test(entry.value))) {
      throw new Error(`Semantic token ${path} must reference a primitive, not a raw value`);
    }
  }
  for (const [path, entry] of Object.entries(primitives)) {
    if (path.startsWith("color.") && !(typeof entry.value === "string" && HEX.test(entry.value))) {
      throw new Error(`Primitive ${path} must be a 6-digit hex color`);
    }
  }

  const all = { ...primitives, ...semantic, ...theme };
  const resolved = {};
  for (const path of Object.keys(all)) {
    resolved[path] = { value: resolveValue(path, all), lineHeight: all[path].lineHeight };
  }

  return { primitives, semantic, theme, resolved };
}

/** Resolved color values keyed by token path, for example "color.text.primary" -> "#0B2D6B". */
export function resolvedColors(tokens = loadTokens()) {
  return Object.fromEntries(
    Object.entries(tokens.resolved)
      .filter(([path]) => path.startsWith("color."))
      .map(([path, entry]) => [path, entry.value]),
  );
}
