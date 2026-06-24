import Link from "next/link";
import { LeagueSchedule } from "@/components/LeagueSchedule";
import { TeamLogo } from "@/components/TeamLogo";
import prisma from "@/lib/prisma";
import { getStandings } from "@/lib/standings";
import { getActiveSeason } from "@/lib/season";
import { DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function FormBadge({ result, tight, opponentName }: { result: "W" | "L"; tight: boolean; opponentName: string }) {
  const colorClass =
    result === "W"
      ? tight
        ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
        : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
      : tight
        ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
        : "text-red-500 border-red-500/30 bg-red-500/10";

  return (
    <span className="group relative inline-flex">
      <span className={`inline-flex h-5 w-5 cursor-default items-center justify-center rounded border text-xs font-black ${colorClass}`}>
        {result}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 shadow-lg group-hover:block">
        {opponentName}
      </span>
    </span>
  );
}


const TOP_RANK_CLASS: Record<number, string> = {
  0: "rank-gold",
  1: "rank-silver",
  2: "rank-bronze",
};

const TOP_RANK_COLOR: Record<number, string> = {
  0: "text-apipana-gold font-black",
  1: "text-slate-300 font-black",
  2: "text-amber-600 font-black",
};

function getRankClass(pos: number, total: number): string {
  if (TOP_RANK_CLASS[pos]) return TOP_RANK_CLASS[pos];
  const fromEnd = total - 1 - pos;
  if (fromEnd === 0 && total > 3) return "rank-danger";
  if (fromEnd === 1 && total > 4) return "rank-warning";
  if (fromEnd === 2 && total > 5) return "rank-caution";
  return "";
}

function getRankColor(pos: number, total: number): string {
  if (TOP_RANK_COLOR[pos]) return TOP_RANK_COLOR[pos];
  const fromEnd = total - 1 - pos;
  if (fromEnd === 0 && total > 3) return "text-red-500 font-black";
  if (fromEnd === 1 && total > 4) return "text-orange-500 font-black";
  if (fromEnd === 2 && total > 5) return "text-yellow-500 font-black";
  return "text-slate-500 font-medium";
}

export default async function LigaPage() {
  const activeSeason = await getActiveSeason().catch(() => null);
  const sid = activeSeason?.id;

  const [division1, division2, division3, matches] = await Promise.all([
    getStandings(1, sid), getStandings(2, sid), getStandings(3, sid),
    prisma.match.findMany({
      include: {
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
      },
      where: sid ? { seasonId: sid } : {},
      orderBy: [{ division: "asc" }, { matchday: "asc" }, { id: "asc" }],
    }),
  ]);
  const divisions = [division1, division2, division3];
  const teamCounts = { 1: division1.length, 2: division2.length, 3: division3.length };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="pb-2 text-6xl font-black leading-tight gradient-text">Liga</h1>
          <p className="mt-1 mb-8 text-slate-400">
            Clasificaciones de las tres divisiones
            {activeSeason ? ` · ${activeSeason.name}` : ""}.
          </p>
        </div>
        <Link className="mt-2 text-sm text-slate-400 hover:text-apipana-gold transition-colors shrink-0" href="/historial">
          Historial →
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        {divisions.map((standings, index) => (
          <article className="glass overflow-hidden rounded-3xl" key={index}>
            <div className={`flex items-center justify-between border-b border-white/10 px-5 py-4`}>
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${DIVISION_COLORS[index + 1].badgeBg} ${DIVISION_COLORS[index + 1].badgeText}`}>
                  {DIVISION_NAMES[index + 1]}
                </span>
                <h2 className={`text-2xl font-black ${DIVISION_COLORS[index + 1].text}`}>División {index + 1}</h2>
              </div>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-slate-400">
                {standings.length} equipos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="score-table w-full table-fixed text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className="w-7 text-center">#</th>
                    <th className="text-left">Equipo</th>
                    <th className="w-8 text-center">J</th>
                    <th className="w-7 text-center">G</th>
                    <th className="w-7 text-center">P</th>
                    <th className="w-10 text-center" title="Diferencia de sets">DS</th>
                    <th className="w-9 text-center">Pts</th>
                    <th className="w-20 text-center" title="Últimos 3 partidos">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, pos) => (
                    <tr className={getRankClass(pos, standings.length)} key={row.team.id}>
                      <td className="text-center">
                        <span className={`text-xs ${getRankColor(pos, standings.length)}`}>
                          {pos + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex min-w-0 items-center gap-2">
                          <TeamLogo name={row.team.name} src={row.team.logoUrl} />
                          <p className="min-w-0 truncate font-semibold">{row.team.name}</p>
                        </div>
                      </td>
                      <td className="text-center text-slate-400">{row.played}</td>
                      <td className="text-center text-slate-400">{row.won}</td>
                      <td className="text-center text-slate-400">{row.lost}</td>
                      <td className="text-center font-semibold text-slate-300 tabular-nums">
                        {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                      </td>
                      <td className="text-center text-lg font-black text-amber-300">{row.points}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {row.form.map((f, i) => (
                            <FormBadge key={i} opponentName={f.opponentName} result={f.result} tight={f.tight} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>

      <LeagueSchedule
        matches={matches}
        teamCounts={teamCounts}
        teamsByDivision={{
          1: division1.map((r) => ({ id: r.team.id, name: r.team.name, logoUrl: r.team.logoUrl })),
          2: division2.map((r) => ({ id: r.team.id, name: r.team.name, logoUrl: r.team.logoUrl })),
          3: division3.map((r) => ({ id: r.team.id, name: r.team.name, logoUrl: r.team.logoUrl })),
        }}
      />
    </main>
  );
}
