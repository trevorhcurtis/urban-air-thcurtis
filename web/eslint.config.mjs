import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Design token rules (see design-system/tests/tokens.test.ts for the same checks as a test).
const TOKEN_RULES = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "Literal[value=/#[0-9A-Fa-f]{6}\\b|#[0-9A-Fa-f]{3}\\b/]",
      message: "Use a design token, not a raw hex color. See web/docs/design-system.md.",
    },
    {
      selector: "TemplateElement[value.raw=/#[0-9A-Fa-f]{6}\\b|#[0-9A-Fa-f]{3}\\b/]",
      message: "Use a design token, not a raw hex color. See web/docs/design-system.md.",
    },
    {
      // Bracketed values such as text-[11px] bypass the tokens. Variant brackets (aria-[...], data-[...]) are allowed.
      selector: "Literal[value=/(?<![\\w-])(?!aria-|data-|supports-|group-|peer-)[a-z][\\w-]*-\\[[^\\]]+\\]/]",
      message: "Use a theme token, not an arbitrary value in brackets. Layout values belong in design-system/tokens/theme.json.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: TOKEN_RULES,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Figma scripts and snapshots written by `pnpm figma generate` (generated, not source).
    "design-system/figma/out/**",
    // Storybook build output (generated, not source).
    "storybook-static/**",
  ]),
]);

export default eslintConfig;
