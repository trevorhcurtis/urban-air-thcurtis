/* eslint-disable @typescript-eslint/no-unused-vars -- main() is called by the generated script, not this file. */
// Runs inside Figma through use_figma. The sync script prepends `const DATA = {...}` and appends `return await main();`.
// Rebuilds each component set or component from its scene tree. Top-level nodes with the same names on the
// page are replaced, and their IDs are returned. Nothing else on the page is touched.

function layoutSet(set, layout) {
  set.layoutMode = "NONE";
  const kids = set.children;
  if (layout.kind === "grid") {
    kids.forEach((c, i) => {
      c.x = (i % layout.cols) * layout.gapX;
      c.y = Math.floor(i / layout.cols) * layout.gapY;
    });
  } else {
    let y = 0;
    for (const c of kids) {
      c.x = 0;
      c.y = y;
      y += c.height + layout.gap;
    }
  }
  const maxX = Math.max(...kids.map((c) => c.x + c.width));
  const maxY = Math.max(...kids.map((c) => c.y + c.height));
  set.resizeWithoutConstraints(Math.ceil(maxX + 24), Math.ceil(maxY + 24));
}

async function main() {
  const fonts = await figma.listAvailableFontsAsync();
  for (const f of DATA.fonts) {
    if (!fonts.some((x) => x.fontName.family === f.family && x.fontName.style === f.style)) {
      return { error: "Font not available: " + f.family + " " + f.style };
    }
  }

  let page = figma.root.children.find((p) => p.name === DATA.pageName);
  if (!page) {
    page = figma.createPage();
    page.name = DATA.pageName;
  }
  await figma.setCurrentPageAsync(page);

  const variables = await figma.variables.getLocalVariablesAsync();
  const varByName = new Map(variables.map((v) => [v.name, v]));
  const effectStyles = await figma.getLocalEffectStylesAsync();
  const effectByName = new Map(effectStyles.map((s) => [s.name, s]));
  const textStyles = await figma.getLocalTextStylesAsync();
  const textStyleByName = new Map(textStyles.map((s) => [s.name, s]));

  const variable = (name) => {
    const v = varByName.get(name);
    if (!v) throw new Error("Variable not found in Figma: " + name);
    return v;
  };
  const paint = (name) => figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", variable(name));
  const bindRadius = (node, name) => {
    const v = variable(name);
    for (const f of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) node.setBoundVariable(f, v);
  };

  async function build(s, isRoot) {
    if (s.k === "text") {
      await figma.loadFontAsync({ family: s.family, style: s.style });
      const t = figma.createText();
      t.fontName = { family: s.family, style: s.style };
      t.fontSize = s.size;
      t.characters = s.characters;
      if (s.textStyle) {
        const st = textStyleByName.get(s.textStyle);
        if (!st) throw new Error("Text style not found in Figma: " + s.textStyle);
        await t.setTextStyleIdAsync(st.id);
      }
      t.fills = [paint(s.fill)];
      if (s.x !== undefined) t.x = s.x;
      if (s.y !== undefined) t.y = s.y;
      return t;
    }
    if (s.k === "ellipse") {
      const e = figma.createEllipse();
      e.name = s.name;
      e.resize(s.width, s.height);
      e.fills = [paint(s.fill)];
      e.x = s.x;
      e.y = s.y;
      return e;
    }
    const f = isRoot ? figma.createComponent() : figma.createFrame();
    f.name = s.name;
    f.layoutMode = s.layout;
    if (s.layout !== "NONE") {
      f.primaryAxisAlignItems = s.primaryAlign;
      f.counterAxisAlignItems = s.counterAlign;
      f.itemSpacing = s.gap;
      f.paddingLeft = s.padX;
      f.paddingRight = s.padX;
      f.paddingTop = s.padY;
      f.paddingBottom = s.padY;
    }
    f.resize(s.width, s.height);
    if (s.layout !== "NONE") {
      f.primaryAxisSizingMode = s.sizing.primary;
      f.counterAxisSizingMode = s.sizing.counter;
    }
    if (s.fill) {
      const p = paint(s.fill);
      f.fills = [s.fillOpacity !== undefined ? { ...p, opacity: s.fillOpacity } : p];
    } else {
      f.fills = [];
    }
    if (s.stroke) {
      f.strokes = [paint(s.stroke)];
      f.strokeWeight = 1;
      f.strokeAlign = "INSIDE";
    } else {
      f.strokes = [];
    }
    if (s.radius) bindRadius(f, s.radius);
    if (s.opacity !== undefined) f.opacity = s.opacity;
    if (s.x !== undefined) f.x = s.x;
    if (s.y !== undefined) f.y = s.y;
    for (const child of s.children) f.appendChild(await build(child, false));
    if (s.effectStyle) {
      const st = effectByName.get(s.effectStyle);
      if (!st) throw new Error("Effect style not found in Figma: " + s.effectStyle);
      await f.setEffectStyleIdAsync(st.id);
    }
    return f;
  }

  const removed = [];
  for (const def of DATA.components) {
    for (const node of [...page.children]) {
      if (node.name === def.name && (node.type === "COMPONENT_SET" || node.type === "COMPONENT")) {
        removed.push({ id: node.id, name: node.name });
        node.remove();
      }
    }
  }

  const created = [];
  for (const def of DATA.components) {
    const roots = [];
    for (const scene of def.scenes) roots.push(await build(scene, true));
    let node;
    if (def.isSet) {
      node = figma.combineAsVariants(roots, page);
      node.name = def.name;
      layoutSet(node, def.layout);
    } else {
      node = roots[0];
      node.name = def.name;
      page.appendChild(node);
    }
    node.description = def.description;
    node.x = def.origin.x;
    node.y = def.origin.y;
    created.push({ name: def.name, id: node.id, type: node.type, variants: def.isSet ? node.children.length : 1 });
  }

  return { pageId: page.id, removed, created };
}
