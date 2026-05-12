import { AdminNav } from "@/components/AdminNav";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";
import { generateLeagues, resetLeagues, updateMatchResult } from "../actions";

export const dynamic = "force-dynamic";

type Search = { team?: string; status?: string };

export default async function PartidosAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const sp = await searchParams;
  const teamFilter = sp.team ? Number(sp.team) : null;
  const statusFilter = sp.status === "pending" || sp.status === "played" || sp.status === "walkover" ? sp.status : "all";

  const [allTeams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ division: "asc" }, { name: "asc" }] }),
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      where: {
        ...(teamFilter ? { OR: [{ homeTeamId: teamFilter }, { awayTeamId: teamFilter }] } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      },
      orderBy: [{ division: "asc" }, { matchday: "asc" }, { id: "asc" }],
    }),
  ]);

  // Group matches by enfrentamiento (unordered pair of teams)
  type Enfrentamiento = {
    key: string;
    division: number;
    teamA: typeof matches[number]["homeTeam"];
    teamB: typeof matches[number]["homeTeam"];
    matches: typeof matches;
  };
  const enfrentamientosMap = new Map<string, Enfrentamiento>();
  for (const match of matches) {
    const lo = Math.min(match.homeTeamId, match.awayTeamId);
    const hi = Math.max(match.homeTeamId, match.awayTeamId);
    const key = `${match.division}-${lo}-${hi}`;
    const existing = enfrentamientosMap.get(key);
    if (existing) {
      existing.matches.push(match);
    } else {
      const teamA = match.homeTeamId === lo ? match.homeTeam : match.awayTeam;
      const teamB = match.homeTeamId === lo ? match.awayTeam : match.homeTeam;
      enfrentamientosMap.set(key, { key, division: match.division, teamA, teamB, matches: [match] });
    }
  }
  const divisions = [1, 2, 3].map((division) => ({
    division,
    enfrentamientos: Array.from(enfrentamientosMap.values()).filter((e) => e.division === division),
  }));

  const filtersActive = teamFilter != null || statusFilter !== "all";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-amber-300">Ligas</h1>
          <p className="mt-2 text-slate-300">Calendario automático. Cada enfrentamiento se juega al mejor de 3 partidos: 2-0, 2-1, 1-2 o 0-2.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={generateLeagues}>
            <ConfirmButton className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950" message="Esto borrará calendario y resultados actuales de las 3 divisiones y generará una liga ida/vuelta nueva. ¿Continuar?">
              Regenerar ligas 1ª/2ª/3ª
            </ConfirmButton>
          </form>
          <form action={resetLeagues}>
            <ConfirmButton className="rounded-full border border-red-300/40 bg-red-950/40 px-5 py-3 font-black text-red-100" message="Esto borrará todos los partidos de las 3 divisiones. ¿Seguro?">
              Borrar calendario
            </ConfirmButton>
          </form>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr_auto]" method="get">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Jugador</span>
          <select className="rounded-lg bg-court-900 px-3 py-2" defaultValue={teamFilter ?? ""} name="team">
            <option value="">Todos</option>
            {[1, 2, 3].map((div) => (
              <optgroup key={div} label={DIVISION_NAMES[div]}>
                {allTeams.filter((t) => t.division === div).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado</span>
          <select className="rounded-lg bg-court-900 px-3 py-2" defaultValue={statusFilter} name="status">
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="played">Jugados</option>
            <option value="walkover">W/O</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className="rounded-lg bg-amber-300 px-4 py-2 font-black text-slate-950" type="submit">
            Filtrar
          </button>
          {filtersActive && (
            <a className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-slate-200" href="/admin/partidos">
              Limpiar
            </a>
          )}
        </div>
      </form>

      <section className="mt-6 space-y-4">
        {divisions.every(({ enfrentamientos }) => enfrentamientos.length === 0) && (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
            No hay partidos con esos filtros.
          </p>
        )}
        {divisions.map(({ division, enfrentamientos }) => {
          if (enfrentamientos.length === 0) return null;
          const totalMatches = enfrentamientos.reduce((acc, e) => acc + e.matches.length, 0);
          return (
            <details className="rounded-3xl border border-white/10 bg-slate-950/70 p-4" key={division} open>
              <summary className="cursor-pointer list-none text-2xl font-black text-amber-300">
                <span className={`mr-2 inline-block rounded px-2 py-0.5 text-xs ${DIVISION_COLORS[division].badgeBg} ${DIVISION_COLORS[division].badgeText}`}>
                  {DIVISION_NAMES[division]}
                </span>
                División {division}
                <span className="ml-2 text-sm font-bold text-slate-400">
                  ({enfrentamientos.length} enfrentamientos, {totalMatches} partidos)
                </span>
              </summary>
              <div className="mt-4 space-y-3">
                {enfrentamientos.map((enf) => (
                  <article className="rounded-2xl border border-white/10 bg-white/7 p-4" key={enf.key}>
                    <header className="mb-3 flex items-center justify-between text-base font-black text-slate-100">
                      <span className="truncate">{enf.teamA.name} <span className="text-slate-500">vs</span> {enf.teamB.name}</span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{enf.matches.length} {enf.matches.length === 1 ? "partido" : "partidos"}</span>
                    </header>
                    <div className="space-y-2">
                      {enf.matches.map((match) => {
                        const decided = match.status === "played" || match.status === "walkover";
                        const homeWon = decided && (match.homeSets ?? 0) > (match.awaySets ?? 0);
                        const awayWon = decided && (match.awaySets ?? 0) > (match.homeSets ?? 0);
                        const isWalkover = match.status === "walkover";
                        const homeScore = isWalkover ? (homeWon ? "W" : "—") : (match.homeSets ?? "-");
                        const awayScore = isWalkover ? (awayWon ? "W" : "—") : (match.awaySets ?? "-");
                        return (
                          <div className="rounded-xl border border-white/10 bg-black/25 p-3" key={match.id}>
                            <div className="grid gap-3 lg:grid-cols-[80px_1fr_auto_1fr_auto] lg:items-center">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Jornada {match.matchday ?? "—"}
                              </span>
                              <p className={`truncate text-base font-black ${homeWon ? "text-emerald-300" : "text-white"}`}>{match.homeTeam.name}</p>
                              <p className="text-center text-xl font-black text-amber-300 tabular-nums">{homeScore}:{awayScore}</p>
                              <p className={`truncate text-base font-black lg:text-right ${awayWon ? "text-emerald-300" : "text-white"}`}>{match.awayTeam.name}</p>
                              <StatusBadge status={match.status} />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {[
                                ["2-0", `${match.homeTeam.name} 2-0`],
                                ["2-1", `${match.homeTeam.name} 2-1`],
                                ["1-2", `${match.awayTeam.name} 2-1`],
                                ["0-2", `${match.awayTeam.name} 2-0`],
                              ].map(([score, label]) => (
                                <form action={updateMatchResult} key={score}>
                                  <input name="id" type="hidden" value={match.id} />
                                  <SubmitButton className="rounded-full bg-emerald-300 px-3 py-2 text-sm font-black text-slate-950" name="score" value={score}>
                                    {label}
                                  </SubmitButton>
                                </form>
                              ))}
                              <form action={updateMatchResult}>
                                <input name="id" type="hidden" value={match.id} />
                                <SubmitButton className="rounded-full border border-rose-300/40 bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-100" name="score" value="wo-home">
                                  W/O · {match.homeTeam.name}
                                </SubmitButton>
                              </form>
                              <form action={updateMatchResult}>
                                <input name="id" type="hidden" value={match.id} />
                                <SubmitButton className="rounded-full border border-rose-300/40 bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-100" name="score" value="wo-away">
                                  W/O · {match.awayTeam.name}
                                </SubmitButton>
                              </form>
                              <form action={updateMatchResult}>
                                <input name="id" type="hidden" value={match.id} />
                                <SubmitButton className="rounded-full border border-white/15 px-3 py-2 text-sm font-bold text-slate-200" name="score" value="pending">
                                  Pendiente
                                </SubmitButton>
                              </form>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          );
        })}
      </section>
    </main>
  );
}
