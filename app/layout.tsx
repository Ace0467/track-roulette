import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Spotify usa su fuente propietaria "Circular" — no tenemos licencia para usarla.
// Montserrat es la alternativa gratuita más cercana visualmente.
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Track Roulette",
  description: "Una canción al azar, elegida por vos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans`}>{children}</body>
    </html>
  );
}
