"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Inicio" },
  { href: "/liga", label: "Liga" },
  { href: "/copa", label: "Copa" },
  { href: "/historial", label: "Historial" },
  { href: "/estadisticas", label: "Stats" },
  { href: "/noticias", label: "Noticias" },
];

const adminNav = { href: "/admin", label: "Admin" };

export function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#110c1d]/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <Link className="flex min-w-0 shrink-0 items-center gap-3" href="/" aria-label="Apipana Tennis Society">
          <span className="relative h-9 w-28 shrink-0 overflow-hidden">
            <Image
              alt="Apipana"
              className="object-contain"
              fill
              priority
              sizes="112px"
              src="/brand/apipana-logo-white.png"
            />
          </span>
          <span className="hidden rounded-full border border-apipana-gold/30 bg-apipana-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-apipana-gold sm:inline-flex">
            Tennis Society
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-0.5">
          {nav.map((item) => (
            <Link
              className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                isActive(item.href)
                  ? "text-white"
                  : "text-slate-400 hover:bg-white/8 hover:text-white"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
              {isActive(item.href) && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-apipana-gold"
                  aria-hidden="true"
                />
              )}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-white/15" aria-hidden="true" />
          <Link
            className={`relative rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              isActive(adminNav.href)
                ? "text-slate-300"
                : "text-slate-600 hover:bg-white/6 hover:text-slate-400"
            }`}
            href={adminNav.href}
          >
            {adminNav.label}
            {isActive(adminNav.href) && (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-white/30"
                aria-hidden="true"
              />
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
