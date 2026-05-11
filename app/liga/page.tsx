import Image from "next/image";
import { LeagueSchedule } from "@/components/LeagueSchedule";
import prisma from "@/lib/prisma";
import { getStandings } from "@/lib/standings";
import { DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function Logo({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10 sm:h-9 sm:w-9">
      {src ? <Image alt={name} className="object-cover" fill src={src} sizes="36px" /> : null}
    </div>
  );
}

const RANK_CLASS: Record<number, string> = {
  0: "rank-gold",
  1: "rank-silver",
  2: "rank-bronze",
};

const RANK_COLOR: Record<number, string> = {
  0: "text-apipana-gold font-black",
  1: "text-slate-300 font-black",
  2: "text-amber-600 font-black",
};

export default async function LigaPage() {
  const [division1, division2, division3, matches] = await Promise.all([
    getStandings(1), getStandings(2), getStandings(3),
    prisma.match.findMany({
      include: {
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
      },
      orderBy: [{ division: "asc" }, { matchday: "asc" }, { id: "asc" }],
    }),
  ]);
  const divisions = [division1, division2, division3];
  const teamCounts = { 1: division1.length, 2: division2.length, 3: division3.length };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <h1 className="pb-2 text-6xl font-black leading-tight gradient-text">Liga</h1>
      <p className="mt-1 mb-8 text-slate-400">Clasificaciones de las tres divisiones.</p>

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
                    <th className="w-8 text-center sm:w-10">#</th>
                    <th className="text-left">Equipo</th>
                    <th className="w-8 text-center sm:w-10">J</th>
                    <th className="w-8 text-center sm:w-10">G</th>
                    <th className="w-8 text-center sm:w-10">P</th>
                    <th className="w-12 text-center sm:w-14" title="Diferencia de sets">DS</th>
                    <th className="w-10 text-center sm:w-14">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, pos) => (
                    <tr className={RANK_CLASS[pos] ?? ""} key={row.team.id}>
                      <td className="text-center">
                        <span className={`text-xs ${RANK_COLOR[pos] ?? "text-slate-500 font-medium"}`}>
                          {pos + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex min-w-0 items-center gap-2">
                          <Logo name={row.team.name} src={row.team.logoUrl} />
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>

      <LeagueSchedule matches={matches} teamCounts={teamCounts} />
    </main>
  );
}
