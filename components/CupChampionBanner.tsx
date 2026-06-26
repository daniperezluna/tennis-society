"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Props = {
  championName: string;
  championLogo: string | null;
  runnerUpName: string | null;
  runnerUpLogo: string | null;
  score: string;
};

const CONFETTI_COLORS = ["#ebb039", "#146da7", "#ffffff", "#f472b6", "#34d399", "#fb923c"];

export function CupChampionBanner({ championName, championLogo, runnerUpName, runnerUpLogo, score }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = "0px";
      piece.style.backgroundColor = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 80}px`);
      piece.style.animationDelay = `${Math.random() * 1.2}s`;
      piece.style.animationDuration = `${1.4 + Math.random() * 0.8}s`;
      piece.style.width = `${6 + Math.random() * 6}px`;
      piece.style.height = `${6 + Math.random() * 6}px`;
      container.appendChild(piece);
      pieces.push(piece);
    }
    return () => { pieces.forEach((p) => p.remove()); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-apipana-gold/30 bg-gradient-to-br from-[#1a1230] via-[#221840] to-[#10283e] p-6 mb-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-apipana-gold/12 blur-3xl" />
      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left sm:gap-8">
        {/* Trophy icon */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="text-5xl leading-none" aria-hidden="true">🏆</span>
        </div>

        {/* Champion info */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-apipana-gold/20 blur-xl" />
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-apipana-gold/60 shadow-lg shadow-apipana-gold/25 bg-white/10">
              {championLogo
                ? <Image alt={championName} className="object-cover" fill sizes="80px" src={championLogo} />
                : <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-apipana-gold">{championName[0]}</span>
              }
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-apipana-gold">Campeón de Copa</p>
            <p className="text-3xl font-black text-white leading-tight">{championName}</p>
            {runnerUpName && (
              <p className="mt-1 text-sm text-slate-400">
                Final: <span className="font-semibold text-slate-300">{score}</span> ante {runnerUpName}
              </p>
            )}
          </div>
        </div>

        {/* Runner-up */}
        {runnerUpName && (
          <div className="ml-auto hidden xl:flex flex-col items-center gap-2 opacity-70">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/10 ring-1 ring-slate-400/30">
              {runnerUpLogo
                ? <Image alt={runnerUpName} className="object-cover" fill sizes="48px" src={runnerUpLogo} />
                : <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-400">{runnerUpName[0]}</span>
              }
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🥈 Subcampeón</p>
            <p className="text-sm font-black text-slate-400">{runnerUpName}</p>
          </div>
        )}
      </div>
    </div>
  );
}
