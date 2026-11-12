import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Inter_Tight } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-inter-tight",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#7A1428",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${interTight.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#main"
          className="mono sr-only z-[100] rounded-full bg-lavender px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
