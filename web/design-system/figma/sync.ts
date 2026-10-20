// Builds the Figma payload from the token JSON and the component contracts, then writes the scripts to run in Figma.
//
//   node design-system/figma/sync.ts generate          writes design-system/figma/out/*.use-figma.js
//   node design-system/figma/sync.ts verify <file>     compares a snapshot returned by Figma with the payload
//
// The scripts are run through the Figma MCP use_figma tool. Nothing here calls Figma directly.

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadTokens } from "../resolve.mjs";
import { buildComponentDefs, type ComponentContracts, type ContractFile } from "./components.ts";
import { buildFoundations, type TokenBundle } from "./payload.ts";
import { verify, type Snapshot } from "./verify.ts";
import { COLLECTIONS, MODE_NAMES, type FigmaPayload, type FontFamily, type FontStyle, type SceneNode } from "./types.ts";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..");
const OUT = join(here, "out");

function readContract(name: string): ContractFile {
  return JSON.parse(readFileSync(join(webRoot, "components", "ui", `${name}.contract.json`), "utf8")) as ContractFile;
}

export function buildPayload(tokens: TokenBundle, contracts: ComponentContracts): FigmaPayload {
  return {
    foundations: buildFoundations(tokens),
    components: buildComponentDefs(tokens, contracts),
    pageName: "Components",
  };
}

/** Every font the components and text styles use, so the Figma script can check them before it writes anything. */
export function collectFonts(payload: FigmaPayload): { family: FontFamily; style: FontStyle }[] {
  const seen = new Map<string, { family: FontFamily; style: FontStyle }>();
  const add = (family: FontFamily, style: FontStyle) => seen.set(`${family}/${style}`, { family, style });
  for (const t of payload.foundations.textStyles) add(t.family, t.style);
  const walk = (node: SceneNode): void => {
    if (node.k === "text") add(node.family, node.style);
    else if (node.k === "frame") node.children.forEach(walk);
  };
  for (const c of payload.components) c.scenes.forEach(walk);
  return [...seen.values()];
}

/** Puts the typed data at the top of a runtime file and calls its main() at the end. */
function emit(runtimeFile: string, data: object | null): string {
  const runtime = readFileSync(join(here, "use-figma", runtimeFile), "utf8");
  const dataLine = data === null ? "" : `const DATA = ${JSON.stringify(data)};\n`;
  return `${dataLine}${runtime}\nreturn await main();\n`;
}

function loadPayload(): FigmaPayload {
  const tokens = loadTokens() as TokenBundle;
  return buildPayload(tokens, {
    button: readContract("Button"),
    badge: readContract("Badge"),
    alert: readContract("Alert"),
    toast: readContract("Toast"),
    heading: readContract("Heading"),
    text: readContract("Text"),
    toggle: readContract("Toggle"),
    divider: readContract("Divider"),
    skeleton: readContract("Skeleton"),
  });
}

/** Each Figma return is capped at 20 KB, so the snapshot is split: one script per collection, and one for styles. */
const SNAPSHOT_PARTS: { file: string; data: object }[] = [
  ...COLLECTIONS.map((collection) => ({ file: `snapshot-${collection.toLowerCase()}.use-figma.js`, data: { collection } })),
  { file: "snapshot-styles.use-figma.js", data: { styles: true } },
];

function generate(payload: FigmaPayload): string[] {
  mkdirSync(OUT, { recursive: true });
  const files: [string, string][] = [
    ["foundations.use-figma.js", emit("foundations.js", { collections: COLLECTIONS, modeNames: MODE_NAMES, foundations: payload.foundations })],
    ["components.use-figma.js", emit("components.js", { pageName: payload.pageName, fonts: collectFonts(payload), components: payload.components })],
    ...SNAPSHOT_PARTS.map((part): [string, string] => [part.file, emit("snapshot.js", part.data)]),
  ];
  for (const [name, text] of files) writeFileSync(join(OUT, name), text);
  return files.map(([name]) => join(OUT, name));
}

/** Joins snapshot parts returned by separate Figma calls into one snapshot. */
export function mergeSnapshots(parts: Partial<Snapshot>[]): Snapshot {
  return {
    collections: parts.flatMap((p) => p.collections ?? []),
    textStyles: parts.flatMap((p) => p.textStyles ?? []),
    effectStyles: parts.flatMap((p) => p.effectStyles ?? []),
    components: parts.flatMap((p) => p.components ?? []),
  };
}

function run(argv: string[]): number {
  const command = argv[0];
  if (command === "generate") {
    const written = generate(loadPayload());
    for (const file of written) console.log(`wrote ${file}`);
    return 0;
  }
  if (command === "verify") {
    const paths = argv.slice(1);
    if (paths.length === 0) throw new Error("Usage: sync.ts verify <snapshot.json> [more.json ...]");
    const parts = paths.map((p) => JSON.parse(readFileSync(p, "utf8")) as Partial<Snapshot>);
    const report = verify(loadPayload(), mergeSnapshots(parts));
    console.log(JSON.stringify(report, null, 2));
    return report.ok ? 0 : 1;
  }
  console.error("Usage: sync.ts generate | verify <snapshot.json> [more.json ...]");
  return 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = run(process.argv.slice(2));
}
