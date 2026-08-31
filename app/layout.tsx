import type { Metadata, Viewport } from "next";
import "@fontsource/audiowide/400.css";
import "@fontsource/rajdhani/600.css";
import "@fontsource/rajdhani/700.css";
import { GlassFilters } from "@/assets/glass-tilt-card";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutable Soldiers",
  description: "ARMY Mutable Soldiers collection experience",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GlassFilters />
        {children}
      </body>
    </html>
  );
}
