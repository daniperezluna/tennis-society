import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display-var",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Apipana Tennis Society",
  description: "Liga de tenis Apipana con clasificación, copa, resultados y noticias.",
  openGraph: {
    title: "Apipana Tennis Society",
    description: "Liga, copa y crónicas. Todo en un sitio.",
    type: "website",
    locale: "es_ES",
    siteName: "Apipana Tennis Society",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apipana Tennis Society",
    description: "Liga, copa y crónicas. Todo en un sitio.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`h-full antialiased ${dmSans.variable} ${outfit.variable}`}>
      <body className="min-h-full bg-background text-foreground">
        <NavBar />
        <div className="flex min-h-[calc(100vh-65px)] flex-col">{children}</div>
        <footer className="mt-auto">
          <div className="court-divider" />
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
            <Link href="/" aria-label="Inicio">
              <span className="relative block h-7 w-24 opacity-50 transition-opacity hover:opacity-80">
                <Image alt="Apipana" className="object-contain" fill sizes="96px" src="/brand/apipana-logo-white.png" />
              </span>
            </Link>
            <p className="text-xs uppercase tracking-widest text-slate-600">
              &copy; {new Date().getFullYear()} Apipana Tennis Society
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
