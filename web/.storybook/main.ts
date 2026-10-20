import type { StorybookConfig } from "@storybook/nextjs-vite";

// Stories sit next to their components. The styleguide page (app/styleguide) is the token reference.
const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: ["../public"],
  // Storybook sends usage telemetry by default. Off here, so the team's Storybook runs do not send it.
  core: { disableTelemetry: true },
  // Tailwind v4 runs through its Vite plugin here, the same way the app uses it through PostCSS and Turbopack.
  viteFinal: async (config) => {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
};

export default config;
