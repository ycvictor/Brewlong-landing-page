import type { Metadata } from "next";
import { Spectral, Yomogi } from "next/font/google";
import { SITE } from "@/content/site";
import "./globals.css";

// Echoes the hand-drawn wordmark in the logo.
const hand = Yomogi({
  variable: "--font-hand",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const serif = Spectral({
  variable: "--font-serif",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.seo.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.seo.description,
    images: [{ url: "/brewlong-square.jpg", width: 1200, height: 1200 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${hand.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-cream-100 font-serif antialiased">
        {children}
      </body>
    </html>
  );
}
