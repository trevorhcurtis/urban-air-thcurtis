import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

// Inter for all UI text, at the four weights the UI uses (400 to 700). Sora only at 800, for brand headlines. Both are loaded through next/font, so no third-party request happens at runtime.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: "800",
});

export const metadata: Metadata = {
  title: { default: "Urban Air", template: "%s | Urban Air" },
  description: "Fly Further Together. Book round-trip and one-way flights with Urban Air.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface-canvas">
        <SiteHeader />
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
