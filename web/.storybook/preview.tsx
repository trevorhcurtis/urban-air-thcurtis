import type { Preview } from "@storybook/nextjs-vite";
import { Inter, Sora } from "next/font/google";
import "../app/globals.css";

// Same font setup as app/layout.tsx, so the stories show the real typography.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: "800" });

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className={`${inter.variable} ${sora.variable} min-h-screen bg-surface-canvas p-6 font-ui text-text-primary antialiased`}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "padded",
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
