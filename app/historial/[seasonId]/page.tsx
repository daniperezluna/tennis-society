import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getStandings } from "@/lib/standings";
import { DIVISION_NAMES, DIVISION_COLORS, CUP_ROUND_LABELS, CUP_ROUND_ORDER, CUP_ROUNDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function Logo({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10">
      {src ? <Image alt={name} className="object-cover" fill src={src} sizes="28px" /> : null}
    </div>
  );
}

export default async function SeasonHistorialPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const sid = parseInt(seasonId);
  if (!sid) notFound();

  const season = await prisma.season.findUnique({ where: { id: sid } });
  if (!season) notFound();

  const [division1, division2, division3, cupMatches] = await Promise.all([
    getStandings(1, sid),
    getStandings(2, sid),
    getStandings(3, sid),
    prisma.cupMatch.findMany({
      where: { seasonId: sid },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { order: "asc" },
    }),
  ]);

  cupMatches.sort((a, b) => CUP_ROUND_ORDER[a.round] - CUP_ROUND_ORDER[b.round] || a.order - b.order);
  const cupRounds = CUP_ROUNDS.filter((r) => cupMatches.some((m) => m.round === r));
  const finalMatch = cupMatches.find((m) => m.round === "final");
  const finalDecided = finalMatch &&
    (finalMatch.status === "played" || finalMatch.status === "walkover") &&
    finalMatch.homeSets != null && finalMatch.awaySets != null;
  const cupWinner = finalDecided
    ? (finalMatch!.homeSets! > finalMatch!.awaySets! ? finalMatch!.homeTeam : finalMatch!.awayTeam)
    : null;
  const cupRunnerUp = finalDecided
    ? (finalMatch!.homeSets! > finalMatch!.awaySets! ? finalMatch!.awayTeam : finalMatch!.homeTeam)
    : null;
  const finalScore = finalDecided
    ? `${Math.max(finalMatch!.homeSets!, finalMatch!.awaySets!)}–${Math.min(finalMatch!.homeSets!, finalMatch!.awaySets!)}`
    : null;

  const divisions = [division1, division2, division3];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 space-y-8">
      <div>
        <Link className="text-sm text-slate-400 hover:text-apipana-gold transition-colors" href="/historial">
          ← Historial
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <h1 className="text-5xl font-black gradient-text">{season.name}</h1>
          <span className="rounded-full bg-slate-600/30 px-3 py-1 text-xs font-bold text-slate-400 border border-slate-500/20">
            {season.status === "active" ? "Activa" : "Cerrada"}
          </span>
        </div>
        <p className="mt-2 text-slate-400">
          Iniciada: {season.createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
          {season.closedAt && (
            <> · Cerrada: {season.closedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</>
          )}
        </p>
      </div>

      {/* Cup podium */}
      {cupWinner && (
        <section className="overflow-hidden rounded-3xl border border-apipana-gold/20 bg-gradient-to-br from-[#1a1230] via-[#221840] to-[#10283e]">
          <div className="px-6 py-4 border-b border-white/8">
            <p className="text-xs font-black uppercase tracking-widest text-apipana-gold">🏆 Podio de Copa</p>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Champion */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-apipana-gold/15 blur-xl" />
                <div className="relative h-28 w-28 overflow-hidden rounded-3xl ring-2 ring-apipana-gold/60 shadow-lg shadow-apipana-gold/20 bg-white/10">
                  {cupWinner.logoUrl
                    ? <Image alt={cupWinner.name} className="object-cover" fill sizes="112px" src={cupWinner.logoUrl} />
                    : <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-apipana-gold">{cupWinner.name[0]}</span>
                  }
                </div>
                <span className="absolute -top-3 -right-3 text-2xl" aria-hidden="true">♛</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-apipana-gold mb-1">Campeón</p>
                <p className="text-xl font-black text-white">{cupWinner.name}</p>
                {finalScore && <p className="text-sm font-bold text-apipana-gold/70 mt-0.5">{finalScore} en la final</p>}
              </div>
            </div>

            <div className="hidden sm:block w-px self-stretch bg-white/10" />

            {/* Runner-up */}
            {cupRunnerUp && (
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="relative">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-slate-400/40 shadow-md bg-white/10">
                    {cupRunnerUp.logoUrl
                      ? <Image alt={cupRunnerUp.name} className="object-cover" fill sizes="80px" src={cupRunnerUp.logoUrl} />
                      : <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-400">{cupRunnerUp.name[0]}</span>
                    }
                  </div>
                  <span className="absolute -top-2 -right-2 text-lg" aria-hidden="true">🥈</span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subcampeón</p>
                  <p className="text-lg font-black text-slate-300">{cupRunnerUp.name}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Standings */}
      <section className="grid gap-6 xl:grid-cols-3">
        {divisions.map((standings, index) => (
          <article className="glass overflow-hidden rounded-3xl" key={index}>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${DIVISION_COLORS[index + 1].badgeBg} ${DIVISION_COLORS[index + 1].badgeText}`}>
                {DIVISION_NAMES[index + 1]}
              </span>
              <h2 className={`text-xl font-black ${DIVISION_COLORS[index + 1].text}`}>División {index + 1}</h2>
            </div>
            {standings.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">Sin datos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="score-table w-full table-fixed text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="w-8 text-center">#</th>
                      <th className="text-left">Equipo</th>
                      <th className="w-8 text-center">G</th>
                      <th className="w-8 text-center">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, pos) => (
                      <tr key={row.team.id}>
                        <td className="text-center font-black text-slate-400">{pos + 1}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Logo name={row.team.name} src={row.team.logoUrl} />
                            <span className="truncate font-semibold">{row.team.name}</span>
                          </div>
                        </td>
                        <td className="text-center font-black text-emerald-400">{row.won}</td>
                        <td className="text-center font-bold text-red-400">{row.lost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        ))}
      </section>

      {/* Cup bracket summary */}
      {cupRounds.length > 0 && (
        <section className="glass rounded-3xl p-6 space-y-5">
          <h2 className="text-xl font-black text-slate-200">Copa</h2>
          {cupRounds.map((round) => (
            <div key={round}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {CUP_ROUND_LABELS[round]}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cupMatches
                  .filter((m) => m.round === round && m.homeSets != null && m.awaySets != null)
                  .map((m) => {
                    const homeWon = (m.homeSets ?? 0) > (m.awaySets ?? 0);
                    return (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 text-sm">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className={`truncate font-semibold ${homeWon ? "text-emerald-400" : "text-slate-400"}`}>
                            {m.homeTeam?.name ?? "?"}
                          </span>
                          <span className={`truncate font-semibold ${!homeWon ? "text-emerald-400" : "text-slate-400"}`}>
                            {m.awayTeam?.name ?? "?"}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 font-black tabular-nums">
                          <span className={homeWon ? "text-emerald-300" : "text-slate-500"}>{m.homeSets}</span>
                          <span className={!homeWon ? "text-emerald-300" : "text-slate-500"}>{m.awaySets}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
