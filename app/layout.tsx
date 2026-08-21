import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-var",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body-var",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  weight: ["400", "500", "600"],
});

const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand-var",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Agentic OS — /control",
  description:
    "One screen, every agent, one shared brain. An AI-agent command center with a shared Obsidian memory vault.",
  manifest: "/control/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#15101a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} ${hand.variable} app-root`}
      >
        {children}
      </body>
    </html>
  );
}
