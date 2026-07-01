"use client";

import { useState } from "react";
import Link from "next/link";
import { PredictionScoreButton } from "@/components/PredictionScoreButton";
import { TeamLogo } from "@/components/TeamLogo";
import { DIVISION_COLORS, DIVISION_NAMES } from "@/lib/constants";
import { upsertPrediction } from "@/app/porra/actions";

export type PorraMatch = {
  id: number;
  division: number;
  matchday: number | null;
  homeTeam: { name: string; logoUrl: string | null };
  awayTeam: { name: string; logoUrl: string | null };
  currentPrediction: string | null;
};

const SCORES = ["2-0", "2-1", "1-2", "0-2"] as const;

export function PorraLeagueMatches({ matches, loggedIn }: { matches: PorraMatch[]; loggedIn: boolean }) {
  const [activeDivision, setActiveDivision] = useState<number | null>(null);

  const availableDivisions = [...new Set(matches.map((m) => m.division))].sort();
  const filtered = activeDivision ? matches.filter((m) => m.division === activeDivision) : matches;

  if (matches.length === 0) {
    return <p className="text-sm text-text-muted">No hay partidos de liga pendientes.</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
            activeDivision === null
              ? "bg-ball-500 text-court-950"
              : "bg-white/8 text-slate-300 hover:bg-white/14"
          }`}
          onClick={() => setActiveDivision(null)}
        >
          Todas
        </button>
        {availableDivisions.map((div) => {
          const colors = DIVISION_COLORS[div];
          const active = activeDivision === div;
          return (
            <button
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                active ? `${colors.badgeBg} ${colors.badgeText}` : "bg-white/8 text-slate-300 hover:bg-white/14"
              }`}
              key={div}
              onClick={() => setActiveDivision(active ? null : div)}
            >
              {DIVISION_NAMES[div]}
            </button>
          );
        })}
      </div>

      <ul className="space-y-3">
        {filtered.map((match) => (
          <li className="rounded-xl border border-border bg-card p-4" key={match.id}>
            {match.matchday != null && (
              <p className="mb-3 text-sm text-text-muted">Jornada {match.matchday}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <TeamLogo name={match.homeTeam.name} src={match.homeTeam.logoUrl} variant="schedule" />
                <span className="max-w-28 truncate font-semibold">{match.homeTeam.name}</span>
              </div>

              {loggedIn ? (
                <div className="flex flex-1 flex-wrap justify-center gap-1.5">
                  {SCORES.map((score) => (
                    <form action={upsertPrediction} key={score}>
                      <input name="matchId" type="hidden" value={match.id} />
                      <input name="score" type="hidden" value={score} />
                      <PredictionScoreButton active={match.currentPrediction === score} score={score} />
                    </form>
                  ))}
                </div>
              ) : (
                <div className="flex-1 text-center">
                  <Link className="text-xs text-ball-500 underline underline-offset-2" href="/login">
                    Inicia sesión para apostar
                  </Link>
                </div>
              )}

              <div className="flex min-w-0 items-center justify-end gap-2">
                <span className="max-w-28 truncate text-right font-semibold">{match.awayTeam.name}</span>
                <TeamLogo name={match.awayTeam.name} src={match.awayTeam.logoUrl} variant="schedule" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
