import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/orbitron/500.css";
import "@fontsource/orbitron/700.css";
import "@fontsource/orbitron/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repulsine — Implosion Dynamics | VRIL LABS",
  description:
    "Real-time 3D visualization of Viktor Schauberger's Repulsine vortex implosion disc — dual counter-rotating spirals, toroidal pressure fields, and centripetal aerodynamics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
