/* eslint-disable @typescript-eslint/no-unused-vars -- main() is called by the generated script, not this file. */
// Runs inside Figma through use_figma. The sync script prepends `const DATA = {...}` and appends `return await main();`.
// Idempotent: variables, text styles, and effect styles are matched by name and updated in place.
// Extra variables that the payload no longer names are reported, not deleted.

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

async function main() {
  const report = { collections: {}, created: [], updated: [], extras: [], textStyles: [], effectStyles: [] };

  const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const collections = {};
  for (const name of DATA.collections) {
    let c = existingCollections.find((x) => x.name === name);
    if (!c) c = figma.variables.createVariableCollection(name);
    if (c.modes.length !== 1) throw new Error("Collection " + name + " has " + c.modes.length + " modes; expected one");
    const modeName = DATA.modeNames[name];
    if (c.modes[0].name !== modeName) c.renameMode(c.modes[0].modeId, modeName);
    collections[name] = c;
    report.collections[name] = c.id;
  }

  const allVars = await figma.variables.getLocalVariablesAsync();
  const collectionById = new Map(Object.values(collections).map((c) => [c.id, c.name]));
  const byKey = new Map();
  for (const v of allVars) {
    const cn = collectionById.get(v.variableCollectionId);
    if (cn) byKey.set(cn + "::" + v.name, v);
  }

  const wanted = new Set(DATA.foundations.variables.map((s) => s.collection + "::" + s.name));

  const findTarget = (name) => {
    for (const cn of DATA.collections) {
      const v = byKey.get(cn + "::" + name);
      if (v) return v;
    }
    throw new Error("Alias target not found in Figma: " + name);
  };

  for (const spec of DATA.foundations.variables) {
    const c = collections[spec.collection];
    const modeId = c.modes[0].modeId;
    const key = spec.collection + "::" + spec.name;
    let v = byKey.get(key);
    const isNew = !v;
    if (isNew) {
      v = figma.variables.createVariable(spec.name, c, spec.type);
      byKey.set(key, v);
    } else if (v.resolvedType !== spec.type) {
      throw new Error("Type change not allowed for " + key + ": " + v.resolvedType + " -> " + spec.type);
    }
    v.scopes = spec.scopes;
    if (spec.codeSyntax) v.setVariableCodeSyntax("WEB", spec.codeSyntax);
    else if (v.codeSyntax && v.codeSyntax.WEB) v.removeVariableCodeSyntax("WEB");

    const value = spec.value;
    if (value.kind === "color") v.setValueForMode(modeId, hexToRgb(value.hex));
    else if (value.kind === "float") v.setValueForMode(modeId, value.number);
    else if (value.kind === "string") v.setValueForMode(modeId, value.text);
    else if (value.kind === "alias") v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: findTarget(value.target).id });
    else throw new Error("Unknown value kind for " + key);

    (isNew ? report.created : report.updated).push(key);
  }

  for (const c of Object.values(collections)) {
    for (const v of allVars) {
      if (v.variableCollectionId !== c.id) continue;
      const key = c.name + "::" + v.name;
      if (!wanted.has(key)) report.extras.push(key);
    }
  }

  const fonts = await figma.listAvailableFontsAsync();
  const hasFont = (family, style) => fonts.some((f) => f.fontName.family === family && f.fontName.style === style);

  const existingText = await figma.getLocalTextStylesAsync();
  for (const s of DATA.foundations.textStyles) {
    if (!hasFont(s.family, s.style)) {
      report.textStyles.push({ name: s.name, skipped: "font not available: " + s.family + " " + s.style });
      continue;
    }
    let st = existingText.find((x) => x.name === s.name);
    if (!st) st = figma.createTextStyle();
    st.name = s.name;
    await figma.loadFontAsync({ family: s.family, style: s.style });
    st.fontName = { family: s.family, style: s.style };
    st.fontSize = s.size;
    st.lineHeight = { unit: "PIXELS", value: s.lineHeight };
    report.textStyles.push({ name: s.name, id: st.id });
  }

  const existingEffect = await figma.getLocalEffectStylesAsync();
  for (const s of DATA.foundations.effectStyles) {
    let st = existingEffect.find((x) => x.name === s.name);
    if (!st) st = figma.createEffectStyle();
    st.name = s.name;
    st.effects = s.effects.map((e) => ({
      type: "DROP_SHADOW",
      color: e.color,
      offset: e.offset,
      radius: e.radius,
      spread: e.spread,
      visible: true,
      blendMode: "NORMAL",
    }));
    report.effectStyles.push({ name: s.name, id: st.id });
  }

  return report;
}
