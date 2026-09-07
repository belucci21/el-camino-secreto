import type { Metadata } from "next";
import { seoConfig } from "../src/config/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.canonical),
  title: seoConfig.title,
  description: seoConfig.description,
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    title: seoConfig.title,
    description: seoConfig.description,
    images: [{ url: seoConfig.image, type: "image/jpeg", width: seoConfig.imageWidth, height: seoConfig.imageHeight, alt: "El Camino del Vínculo — Gladiola & Jordi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.title,
    description: seoConfig.description,
    images: [seoConfig.image],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
