// Compares what Figma returned (use-figma/snapshot.js) with the payload the sync built.
// Reports every mismatch. Extras are reported separately, because they are not sync errors by themselves.

import { MODE_NAMES } from "./types.ts";
import type { CollectionName, EffectStyleSpec, FigmaPayload, FigmaScope, TextStyleSpec, VariableSpec } from "./types.ts";

export type SnapshotValue =
  | { kind: "color"; hex: string }
  | { kind: "float"; number: number }
  | { kind: "string"; text: string }
  | { kind: "alias"; target: string | null };

export interface SnapshotVariable {
  name: string;
  type: "COLOR" | "FLOAT" | "STRING";
  scopes: FigmaScope[];
  codeSyntaxWeb: string | null;
  value: SnapshotValue;
}

export interface Snapshot {
  collections: { name: string; modes: string[]; variables: SnapshotVariable[] }[];
  textStyles: { name: string; family: string; style: string; size: number; lineHeight: number | null }[];
  effectStyles: {
    name: string;
    effects: { type: string; color: { r: number; g: number; b: number; a: number }; offset: { x: number; y: number }; radius: number; spread: number }[];
  }[];
  components: { name: string; type: "COMPONENT" | "COMPONENT_SET"; description: string; variants: string[] }[];
}

export interface VerifyReport {
  ok: boolean;
  problems: string[];
  extras: string[];
}

const EPS = 1e-6;

function sameScopes(a: readonly string[], b: readonly string[]): boolean {
  return [...a].sort().join(",") === [...b].sort().join(",");
}

function sameValue(spec: VariableSpec, actual: SnapshotValue): string | null {
  const want = spec.value;
  if (want.kind !== actual.kind) return `kind ${actual.kind}, expected ${want.kind}`;
  if (want.kind === "color" && actual.kind === "color" && want.hex.toUpperCase() !== actual.hex.toUpperCase()) {
    return `color ${actual.hex}, expected ${want.hex}`;
  }
  if (want.kind === "float" && actual.kind === "float" && Math.abs(want.number - actual.number) > EPS) {
    return `number ${actual.number}, expected ${want.number}`;
  }
  if (want.kind === "string" && actual.kind === "string" && want.text !== actual.text) {
    return `text "${actual.text}", expected "${want.text}"`;
  }
  if (want.kind === "alias" && actual.kind === "alias" && want.target !== actual.target) {
    return `alias ${actual.target}, expected ${want.target}`;
  }
  return null;
}

function checkVariables(payload: FigmaPayload, snapshot: Snapshot, problems: string[], extras: string[]): void {
  const byCollection = new Map(snapshot.collections.map((c) => [c.name, c]));
  for (const collection of Object.keys(MODE_NAMES) as CollectionName[]) {
    const snap = byCollection.get(collection);
    if (!snap) {
      problems.push(`Collection ${collection} is missing in Figma`);
      continue;
    }
    if (!snap.modes.includes(MODE_NAMES[collection])) {
      problems.push(`Collection ${collection} has modes ${snap.modes.join(", ")}, expected ${MODE_NAMES[collection]}`);
    }
  }

  for (const spec of payload.foundations.variables) {
    const snap = byCollection.get(spec.collection);
    const found = snap?.variables.find((v) => v.name === spec.name);
    const where = `${spec.collection}::${spec.name}`;
    if (!found) {
      problems.push(`Variable ${where} is missing in Figma`);
      continue;
    }
    if (found.type !== spec.type) problems.push(`${where}: type ${found.type}, expected ${spec.type}`);
    if (!sameScopes(found.scopes, spec.scopes)) problems.push(`${where}: scopes [${found.scopes}], expected [${spec.scopes}]`);
    if ((found.codeSyntaxWeb ?? null) !== (spec.codeSyntax ?? null)) {
      problems.push(`${where}: code syntax ${found.codeSyntaxWeb}, expected ${spec.codeSyntax ?? "none"}`);
    }
    const valueProblem = sameValue(spec, found.value);
    if (valueProblem) problems.push(`${where}: ${valueProblem}`);
  }

  const wanted = new Set(payload.foundations.variables.map((s) => `${s.collection}::${s.name}`));
  for (const snap of snapshot.collections) {
    for (const v of snap.variables) {
      const key = `${snap.name}::${v.name}`;
      if (!wanted.has(key)) extras.push(key);
    }
  }
}

function sameShadow(a: EffectStyleSpec["effects"][number], b: Snapshot["effectStyles"][number]["effects"][number]): boolean {
  const close = (x: number, y: number) => Math.abs(x - y) < 1e-3;
  return (
    a.type === b.type &&
    close(a.color.r, b.color.r) &&
    close(a.color.g, b.color.g) &&
    close(a.color.b, b.color.b) &&
    close(a.color.a, b.color.a) &&
    close(a.offset.x, b.offset.x) &&
    close(a.offset.y, b.offset.y) &&
    close(a.radius, b.radius) &&
    close(a.spread, b.spread)
  );
}

function checkStyles(payload: FigmaPayload, snapshot: Snapshot, problems: string[], extras: string[]): void {
  for (const spec of payload.foundations.textStyles) {
    const found = snapshot.textStyles.find((s) => s.name === spec.name);
    if (!found) {
      problems.push(`Text style ${spec.name} is missing in Figma`);
      continue;
    }
    if (!sameText(spec, found)) problems.push(`Text style ${spec.name}: ${JSON.stringify(found)} does not match ${JSON.stringify(spec)}`);
  }
  for (const s of snapshot.textStyles) {
    if (!payload.foundations.textStyles.some((x: TextStyleSpec) => x.name === s.name)) extras.push(`Text style ${s.name}`);
  }

  for (const spec of payload.foundations.effectStyles) {
    const found = snapshot.effectStyles.find((s) => s.name === spec.name);
    if (!found) {
      problems.push(`Effect style ${spec.name} is missing in Figma`);
      continue;
    }
    const ok = found.effects.length === spec.effects.length && spec.effects.every((e, i) => sameShadow(e, found.effects[i]));
    if (!ok) problems.push(`Effect style ${spec.name} does not match its token`);
  }
  for (const s of snapshot.effectStyles) {
    if (!payload.foundations.effectStyles.some((x) => x.name === s.name)) extras.push(`Effect style ${s.name}`);
  }
}

function sameText(a: TextStyleSpec, b: Snapshot["textStyles"][number]): boolean {
  return a.family === b.family && a.style === b.style && Math.abs(a.size - b.size) < EPS && b.lineHeight !== null && Math.abs(a.lineHeight - b.lineHeight) < EPS;
}

function checkComponents(payload: FigmaPayload, snapshot: Snapshot, problems: string[]): void {
  for (const def of payload.components) {
    const found = snapshot.components.find((c) => c.name === def.name);
    if (!found) {
      problems.push(`Component ${def.name} is missing on the Components page`);
      continue;
    }
    const wantType = def.isSet ? "COMPONENT_SET" : "COMPONENT";
    if (found.type !== wantType) problems.push(`Component ${def.name}: type ${found.type}, expected ${wantType}`);
    if (found.description !== def.description) problems.push(`Component ${def.name}: description differs from the payload`);
    if (def.isSet) {
      const want = def.scenes.map((s) => s.name).sort().join("|");
      const got = [...found.variants].sort().join("|");
      if (want !== got) problems.push(`Component ${def.name}: variants [${got}] do not match [${want}]`);
    }
  }
}

/** Compares a Figma snapshot with the payload. `ok` is true only when there are no problems. */
export function verify(payload: FigmaPayload, snapshot: Snapshot): VerifyReport {
  const problems: string[] = [];
  const extras: string[] = [];
  checkVariables(payload, snapshot, problems, extras);
  checkStyles(payload, snapshot, problems, extras);
  checkComponents(payload, snapshot, problems);
  return { ok: problems.length === 0, problems, extras };
}
