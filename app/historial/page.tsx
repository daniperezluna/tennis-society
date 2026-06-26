import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getAllSeasons } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const [seasons, hallOfFameMatches] = await Promise.all([
    getAllSeasons(),
    prisma.cupMatch.findMany({
      where: { round: "final", status: { in: ["played", "walkover"] }, season: { status: "closed" } },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        season: { select: { id: true, name: true } },
      },
      orderBy: { season: { id: "asc" } },
    }),
  ]);

  const closedSeasons = seasons.filter((s) => s.status === "closed");

  const hallOfFame = hallOfFameMatches
    .map((m) => {
      if (m.homeSets == null || m.awaySets == null) return null;
      const winner = m.homeSets > m.awaySets ? m.homeTeam : m.awayTeam;
      if (!winner) return null;
      return { seasonId: m.season.id, seasonName: m.season.name, winner };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const cupChampionBySeason = new Map(hallOfFame.map((e) => [e.seasonId, e.winner]));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 space-y-10">
      <div>
        <h1 className="text-5xl font-black gradient-text">Historial</h1>
        <p className="mt-2 text-slate-400">Temporadas pasadas de la Apipana Tennis Society.</p>
      </div>

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-apipana-gold/20 bg-gradient-to-br from-[#1a1230] via-[#221840] to-[#10283e]">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">🏆</span>
            <h2 className="text-lg font-black text-apipana-gold">Hall of Fame · Campeones de Copa</h2>
          </div>
          <div className="flex flex-wrap gap-6 p-6">
            {hallOfFame.map((entry) => (
              <Link
                key={entry.seasonId}
                href={`/historial/${entry.seasonId}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-apipana-gold/10 opacity-0 group-hover:opacity-100 blur-lg transition-opacity" />
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-apipana-gold/30 group-hover:ring-apipana-gold/70 transition-all shadow-md shadow-apipana-gold/10">
                    {entry.winner.logoUrl
                      ? <Image alt={entry.winner.name} className="object-cover" fill sizes="64px" src={entry.winner.logoUrl} />
                      : <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-apipana-gold">{entry.winner.name[0]}</span>
                    }
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 text-base leading-none" aria-hidden="true">♛</span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-white group-hover:text-apipana-gold transition-colors">{entry.winner.name}</p>
                  <p className="text-[10px] text-slate-500">{entry.seasonName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {closedSeasons.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-slate-400">
          Aún no hay temporadas cerradas. El historial aparecerá aquí cuando termine la primera.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {closedSeasons.map((s) => {
            const champion = cupChampionBySeason.get(s.id);
            return (
              <Link
                className="glass card-hover rounded-3xl p-6 flex items-center gap-4"
                href={`/historial/${s.id}`}
                key={s.id}
              >
                {champion && (
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-apipana-gold/30">
                      {champion.logoUrl
                        ? <Image alt={champion.name} className="object-cover" fill sizes="56px" src={champion.logoUrl} />
                        : <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-apipana-gold">{champion.name[0]}</span>
                      }
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 text-sm leading-none" aria-hidden="true">♛</span>
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="text-2xl font-black text-slate-200">{s.name}</h2>
                  {champion && <p className="text-xs font-semibold text-apipana-gold truncate">{champion.name} · Campeón</p>}
                  <p className="text-sm text-slate-400">
                    {s._count.matches} partidos · {s._count.seasonTeams} equipos
                  </p>
                  {s.closedAt && (
                    <p className="text-xs text-slate-600">
                      Finalizada:{" "}
                      {s.closedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
