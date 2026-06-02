import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-orbitron",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`h-full ${orbitron.variable} ${inter.variable}`}>
      <body className="h-full font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
