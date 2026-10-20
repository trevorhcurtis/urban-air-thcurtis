/* eslint-disable @typescript-eslint/no-unused-vars -- main() is called by the generated script, not this file. */
// Runs inside Figma through use_figma. Read-only. Returns part of the variables, styles, and components the
// verifier compares against the payload. The sync script prepends DATA and appends `return await main();`.
// DATA.collection limits the variables to one collection. DATA.styles includes text styles, effect styles, and
// components. Each Figma return is capped at 20 KB, so the sync writes one part per call.

function rgbToHex(c) {
  const h = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return ("#" + h(c.r) + h(c.g) + h(c.b)).toUpperCase();
}

async function main() {
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const collections = DATA.collection ? allCollections.filter((c) => c.name === DATA.collection) : [];
  const vars = await figma.variables.getLocalVariablesAsync();
  const varById = new Map(vars.map((v) => [v.id, v]));

  const snapValue = (raw) => {
    if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
      const target = varById.get(raw.id);
      return { kind: "alias", target: target ? target.name : null };
    }
    if (raw && typeof raw === "object" && "r" in raw) return { kind: "color", hex: rgbToHex(raw) };
    if (typeof raw === "number") return { kind: "float", number: raw };
    return { kind: "string", text: String(raw) };
  };

  const variableCollections = collections.map((c) => ({
    name: c.name,
    modes: c.modes.map((m) => m.name),
    variables: c.variableIds
      .map((id) => varById.get(id))
      .filter(Boolean)
      .map((v) => ({
        name: v.name,
        type: v.resolvedType,
        scopes: [...v.scopes],
        codeSyntaxWeb: (v.codeSyntax && v.codeSyntax.WEB) || null,
        value: snapValue(v.valuesByMode[c.modes[0].modeId]),
      })),
  }));

  if (!DATA.styles) return { collections: variableCollections };

  const textStyles = (await figma.getLocalTextStylesAsync()).map((s) => ({
    name: s.name,
    family: s.fontName.family,
    style: s.fontName.style,
    size: s.fontSize,
    lineHeight: s.lineHeight && s.lineHeight.unit === "PIXELS" ? s.lineHeight.value : null,
  }));

  const effectStyles = (await figma.getLocalEffectStylesAsync()).map((s) => ({
    name: s.name,
    effects: s.effects.map((e) => ({
      type: e.type,
      color: { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a },
      offset: { x: e.offset.x, y: e.offset.y },
      radius: e.radius,
      spread: e.spread || 0,
    })),
  }));

  const page = figma.root.children.find((p) => p.name === "Components");
  let components = [];
  if (page) {
    await figma.setCurrentPageAsync(page);
    components = page.children
      .filter((n) => n.type === "COMPONENT_SET" || n.type === "COMPONENT")
      .map((n) => ({
        name: n.name,
        type: n.type,
        description: n.description || "",
        variants: n.type === "COMPONENT_SET" ? n.children.map((c) => c.name) : [],
      }));
  }

  return { textStyles, effectStyles, components };
}
