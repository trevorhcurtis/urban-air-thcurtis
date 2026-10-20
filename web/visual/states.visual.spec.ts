import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Visual baselines for interactive states. The static story screenshots in stories.visual.spec.ts
 * only show rest state. Each test here opens a story and drives the real state with the mouse or the
 * keyboard, so the screenshot shows the styles a visitor sees. Nothing is forced with a class.
 *
 * Regenerate with: pnpm run visual:update (or pnpm run visual:stories -- --update-snapshots).
 */
type Target = "first-button" | "first-input" | "first-checkbox" | "first-radio" | "first-switch" | "select" | "textarea";

type State = "hover" | "focus" | "focus-visible" | "pressed";

const STATES: { name: string; storyId: string; state: State; target: Target }[] = [
  { name: "input-hover", storyId: "primitives-form-fields--default", state: "hover", target: "first-input" },
  { name: "input-focus", storyId: "primitives-form-fields--default", state: "focus", target: "first-input" },
  { name: "input-error-focus", storyId: "primitives-form-fields--error", state: "focus", target: "first-input" },
  { name: "select-focus", storyId: "primitives-form-fields--select", state: "focus", target: "select" },
  { name: "textarea-focus", storyId: "primitives-form-fields--textarea", state: "focus", target: "textarea" },
  { name: "checkbox-focus", storyId: "primitives-selection--unchecked", state: "focus", target: "first-checkbox" },
  { name: "checkbox-checked-focus", storyId: "primitives-selection--checked", state: "focus", target: "first-checkbox" },
  { name: "radio-focus", storyId: "primitives-selection--radio-group", state: "focus", target: "first-radio" },
  { name: "toggle-focus", storyId: "primitives-selection--toggle-switch", state: "focus", target: "first-switch" },
  { name: "button-primary-hover", storyId: "primitives-button--primary", state: "hover", target: "first-button" },
  { name: "button-primary-focus-visible", storyId: "primitives-button--primary", state: "focus-visible", target: "first-button" },
  { name: "button-secondary-hover", storyId: "primitives-button--secondary", state: "hover", target: "first-button" },
  { name: "button-soft-hover", storyId: "primitives-button--soft", state: "hover", target: "first-button" },
  { name: "button-ghost-hover", storyId: "primitives-button--ghost", state: "hover", target: "first-button" },
  { name: "button-destructive-hover", storyId: "primitives-button--destructive", state: "hover", target: "first-button" },
  { name: "button-primary-pressed", storyId: "primitives-button--primary", state: "pressed", target: "first-button" },
  { name: "button-secondary-pressed", storyId: "primitives-button--secondary", state: "pressed", target: "first-button" },
  { name: "button-soft-pressed", storyId: "primitives-button--soft", state: "pressed", target: "first-button" },
  { name: "button-ghost-pressed", storyId: "primitives-button--ghost", state: "pressed", target: "first-button" },
  { name: "button-destructive-pressed", storyId: "primitives-button--destructive", state: "pressed", target: "first-button" },
];

const LOCATORS: Record<Target, (page: Page) => Locator> = {
  "first-button": (page) => page.getByRole("button").first(),
  "first-input": (page) => page.locator("#storybook-root input").first(),
  "first-checkbox": (page) => page.locator("#storybook-root input[type=checkbox]").first(),
  "first-radio": (page) => page.locator("#storybook-root input[type=radio]").first(),
  "first-switch": (page) => page.getByRole("switch").first(),
  select: (page) => page.locator("#storybook-root select").first(),
  textarea: (page) => page.locator("#storybook-root textarea").first(),
};

async function drive(page: Page, target: Target, state: State) {
  const control = LOCATORS[target](page);
  if (state === "hover") {
    await control.hover();
    return;
  }
  if (state === "pressed") {
    // Hold the mouse button down over the control, so the :active style is on screen.
    await control.hover();
    await page.mouse.down();
    return;
  }
  if (state === "focus") {
    await control.focus();
  } else {
    // Tab from the page start, so the browser shows the keyboard focus ring like it does for a visitor.
    await page.keyboard.press("Tab");
  }
  await expect(control).toBeFocused();
}

for (const { name, storyId, state, target } of STATES) {
  test(`${name} matches its baseline`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await drive(page, target, state);
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${name}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    });
  });
}
