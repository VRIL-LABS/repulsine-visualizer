import type { Metadata } from "next";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
