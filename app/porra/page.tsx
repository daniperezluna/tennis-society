import Link from "next/link";
import { PredictionScoreButton } from "@/components/PredictionScoreButton";
import { PorraLeagueMatches, type PorraMatch } from "@/components/PorraLeagueMatches";
import { TeamLogo } from "@/components/TeamLogo";
import { getAdminUser } from "@/lib/auth";
import { CUP_ROUND_LABELS } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { upsertPrediction } from "./actions";

export const dynamic = "force-dynamic";

const SCORES = ["2-0", "2-1", "1-2", "0-2"] as const;

export default async function PorraPage() {
  const user = await getAdminUser();

  const activeSeason = await prisma.season.findFirst({ where: { status: "active" } });

  const [leaderboard, rawMatches, pendingCupMatches] = await Promise.all([
    fetchLeaderboard(),
    activeSeason
      ? prisma.match.findMany({
          where: { seasonId: activeSeason.id, status: "pending" },
          include: {
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
            predictions: user ? { where: { userId: user.id } } : false,
          },
          orderBy: [{ division: "asc" }, { matchday: "asc" }, { id: "asc" }],
        })
      : [],
    activeSeason
      ? prisma.cupMatch.findMany({
          where: {
            seasonId: activeSeason.id,
            status: "pending",
            homeTeamId: { not: null },
            awayTeamId: { not: null },
          },
          include: {
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
            predictions: user ? { where: { userId: user.id } } : false,
          },
          orderBy: [{ order: "asc" }],
        })
      : [],
  ]);

  const pendingMatches: PorraMatch[] = rawMatches.map((m) => {
    const pred = "predictions" in m ? m.predictions[0] : undefined;
    return {
      id: m.id,
      division: m.division,
      matchday: m.matchday,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      currentPrediction: pred ? `${pred.homeSets}-${pred.awaySets}` : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-4xl font-black text-ball-500">Porra</h1>
      <p className="mt-2 text-sm text-text-muted">Adivina el marcador exacto y sube en la clasificación.</p>

      {/* Clasificación */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-black text-ball-500">Clasificación</h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-text-muted">Aún no hay resultados evaluados.</p>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((entry, i) => (
              <li key={entry.userId} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <span className="w-6 shrink-0 text-center text-sm font-black text-text-muted">{i + 1}</span>
                {entry.team ? (
                  <TeamLogo name={entry.team.name} src={entry.team.logoUrl} variant="schedule" />
                ) : (
                  <span className="h-7 w-7 shrink-0 rounded-xl bg-white/10 ring-1 ring-white/10" />
                )}
                <span className="flex-1 font-semibold">{entry.name ?? entry.email}</span>
                <span className="tabular-nums text-sm">
                  <span className="font-black text-ball-500">{entry.correct}</span>
                  <span className="text-text-muted"> / {entry.total}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Partidos de liga */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-black text-ball-500">Liga — partidos pendientes</h2>
        <PorraLeagueMatches loggedIn={!!user} matches={pendingMatches} />
      </section>

      {/* Partidos de copa */}
      <section className="mt-10">
        <h2 className="mb-3 text-xl font-black text-ball-500">Copa — partidos pendientes</h2>
        {pendingCupMatches.length === 0 ? (
          <p className="text-sm text-text-muted">No hay partidos de copa pendientes.</p>
        ) : (
          <ul className="space-y-3">
            {pendingCupMatches.map((match) => {
              const pred = "predictions" in match ? match.predictions[0] : undefined;
              const currentPrediction = pred ? `${pred.homeSets}-${pred.awaySets}` : null;
              return (
                <li key={match.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-3 text-sm text-text-muted">{CUP_ROUND_LABELS[match.round]}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamLogo name={match.homeTeam!.name} src={match.homeTeam!.logoUrl} variant="schedule" />
                      <span className="max-w-28 truncate font-semibold">{match.homeTeam!.name}</span>
                    </div>
                    {user ? (
                      <div className="flex flex-1 flex-wrap justify-center gap-1.5">
                        {SCORES.map((score) => (
                          <form action={upsertPrediction} key={score}>
                            <input name="cupMatchId" type="hidden" value={match.id} />
                            <input name="score" type="hidden" value={score} />
                            <PredictionScoreButton active={currentPrediction === score} score={score} />
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
                      <span className="max-w-28 truncate text-right font-semibold">{match.awayTeam!.name}</span>
                      <TeamLogo name={match.awayTeam!.name} src={match.awayTeam!.logoUrl} variant="schedule" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

async function fetchLeaderboard() {
  const users = await prisma.adminUser.findMany({
    where: { predictions: { some: { correct: { not: null } } } },
    select: {
      id: true,
      name: true,
      email: true,
      team: { select: { name: true, logoUrl: true } },
      predictions: { where: { correct: { not: null } }, select: { correct: true } },
    },
  });

  return users
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      team: u.team,
      correct: u.predictions.filter((p) => p.correct).length,
      total: u.predictions.length,
    }))
    .sort((a, b) => b.correct - a.correct || b.total - a.total);
}
