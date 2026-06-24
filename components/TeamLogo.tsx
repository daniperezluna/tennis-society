"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type TeamLogoProps = {
  src?: string | null;
  name: string;
  variant?: "standings" | "schedule";
};

export function TeamLogo({ src, name, variant = "standings" }: TeamLogoProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const containerClass =
    variant === "schedule"
      ? "relative h-7 w-7 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10"
      : "relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10 sm:h-9 sm:w-9";

  const imageSize = variant === "schedule" ? "28px" : "36px";

  return (
    <>
      <span
        className={`${containerClass}${src ? " cursor-pointer transition-opacity hover:opacity-75" : ""}`}
        onClick={() => src && setOpen(true)}
        title={src ? name : undefined}
      >
        {src ? <Image alt={name} className="object-cover" fill sizes={imageSize} src={src} /> : null}
      </span>

      {open && src && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex flex-col items-center gap-4 rounded-3xl bg-slate-900/90 p-8 shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Cerrar"
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="relative h-48 w-48 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image alt={name} className="object-contain p-2" fill sizes="192px" src={src} />
            </div>
            <p className="text-center text-lg font-black text-slate-100">{name}</p>
          </div>
        </div>
      )}
    </>
  );
}