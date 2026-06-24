import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { getAllSeasons, getSeasonTeams } from "@/lib/season";
import { createNewSeasonAction, moveTeamDivision } from "../actions";
import prisma from "@/lib/prisma";
import { DIVISION_NAMES } from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function TemporadasAdminPage() {
  await requireAdmin();
  const [seasons, allTeams] = await Promise.all([
    getAllSeasons(),
    prisma.team.findMany({ orderBy: [{ division: "asc" }, { name: "asc" }] }),
  ]);

  const activeSeason = seasons.find((s) => s.status === "active") ?? null;
  const closedSeasons = seasons.filter((s) => s.status === "closed");

  const activeSeasonTeams = activeSeason ? await getSeasonTeams(activeSeason.id) : [];

  const playedMatches = activeSeason
    ? await prisma.match.findMany({
        where: { seasonId: activeSeason.id, status: { not: "pending" } },
        select: { homeTeamId: true, awayTeamId: true },
      })
    : [];
  const teamsWithPlayedMatches = new Set(playedMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 space-y-8">
      <AdminNav />
      <div>
        <Link className="text-sm text-slate-400 hover:text-apipana-gold transition-colors" href="/admin">
          ← Admin
        </Link>
        <h1 className="mt-4 text-4xl font-black gradient-text">Temporadas</h1>
      </div>

      {/* Active season */}
      {activeSeason ? (
        <section className="glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-200">{activeSeason.name}</h2>
            <span className="rounded-full bg-emerald-400/15 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-400/30">
              Activa
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Iniciada el {activeSeason.createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
            {" · "}{activeSeason._count.matches} partidos · {activeSeasonTeams.length} equipos
          </p>

          {activeSeasonTeams.length > 0 && (
            <div className="divide-y divide-white/5 rounded-2xl border border-white/8 overflow-hidden">
              {[1, 2, 3].map((div) => {
                const divTeams = activeSeasonTeams.filter((st) => st.division === div);
                if (!divTeams.length) return null;
                return (
                  <div key={div} className="px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      {DIVISION_NAMES[div]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {divTeams.map((st) => (
                        <span key={st.id} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                          {st.team.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="glass rounded-3xl p-6 text-slate-400">No hay ninguna temporada activa.</div>
      )}

      {/* Move teams between divisions */}
      {activeSeason && activeSeasonTeams.length > 0 && (
        <section className="glass rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-200">Mover equipos de división</h2>
            <p className="mt-1 text-xs text-slate-500">
              Solo equipos sin partidos disputados. Al mover, sus partidos pendientes se eliminarán — regenera la liga después.
            </p>
          </div>
          <div className="divide-y divide-white/5 rounded-2xl border border-white/8 overflow-hidden">
            {activeSeasonTeams.map((st) => {
              const hasPlayed = teamsWithPlayedMatches.has(st.teamId);
              return hasPlayed ? (
                <div key={st.id} className="flex items-center justify-between px-4 py-2.5 opacity-40">
                  <span className="text-sm font-semibold text-slate-400">{st.team.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">{DIVISION_NAMES[st.division]}</span>
                    <span className="rounded-md bg-slate-700/40 px-2 py-0.5 text-xs text-slate-500">Con partidos</span>
                  </div>
                </div>
              ) : (
                <form action={moveTeamDivision} className="flex items-center justify-between px-4 py-2.5 gap-3" key={st.id}>
                  <input name="seasonTeamId" type="hidden" value={st.id} />
                  <span className="text-sm font-semibold text-slate-200">{st.team.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">{DIVISION_NAMES[st.division]}</span>
                    <span className="text-slate-600">→</span>
                    <select
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white appearance-none focus:outline-none focus:ring-1 focus:ring-apipana-gold/40"
                      defaultValue={st.division}
                      name="division"
                    >
                      {[1, 2, 3].map((d) => (
                        <option key={d} value={d}>{DIVISION_NAMES[d]}</option>
                      ))}
                    </select>
                    <SubmitButton
                      className="shrink-0 rounded-xl border border-apipana-gold/30 bg-apipana-gold/15 px-3 py-1.5 text-xs font-black text-apipana-gold transition-colors hover:bg-apipana-gold/25"
                      pendingLabel="…"
                    >
                      Mover
                    </SubmitButton>
                  </div>
                </form>
              );
            })}
          </div>
        </section>
      )}

      {/* Create new season form */}
      <section className="glass rounded-3xl p-6 space-y-5">
        <h2 className="text-lg font-black text-slate-200">Crear nueva temporada</h2>
        <form action={createNewSeasonAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-apipana-gold">
                Nombre de la nueva temporada
              </label>
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-apipana-gold/40"
                name="name"
                placeholder="Temporada 2"
                required
                type="text"
              />
            </div>
            <div className="flex items-end gap-3 pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-300">
                <input
                  className="h-4 w-4 rounded accent-apipana-gold"
                  defaultChecked
                  name="closeCurrent"
                  type="checkbox"
                />
                Cerrar la temporada actual al crear
              </label>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Equipos participantes — marca y asigna división
            </p>
            <div className="divide-y divide-white/5 rounded-2xl border border-white/8 overflow-hidden">
              {allTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between px-4 py-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      className="h-4 w-4 rounded accent-apipana-gold"
                      name="teamId"
                      type="checkbox"
                      value={team.id}
                    />
                    <span className="text-sm font-semibold text-slate-200">{team.name}</span>
                  </label>
                  <select
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white appearance-none focus:outline-none focus:ring-1 focus:ring-apipana-gold/40"
                    defaultValue={team.division}
                    name={`division_${team.id}`}
                  >
                    <option value={1}>{DIVISION_NAMES[1]}</option>
                    <option value={2}>{DIVISION_NAMES[2]}</option>
                    <option value={3}>{DIVISION_NAMES[3]}</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-300">
            Los partidos de la temporada actual se conservan. Después de crear la nueva temporada, regenera la liga y la copa desde sus respectivos paneles.
          </div>

          <SubmitButton
            className="rounded-xl bg-apipana-gold px-6 py-3 text-sm font-black text-black hover:bg-apipana-gold/80 transition-colors"
            pendingLabel="Creando…"
          >
            Crear temporada
          </SubmitButton>
        </form>
      </section>

      {/* Closed seasons */}
      {closedSeasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-200">Temporadas cerradas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {closedSeasons.map((s) => (
              <Link
                className="glass card-hover rounded-2xl p-5 space-y-1"
                href={`/historial/${s.id}`}
                key={s.id}
              >
                <div className="flex items-center gap-2">
                  <p className="text-base font-black text-slate-200">{s.name}</p>
                  <span className="rounded-full bg-slate-600/30 px-2 py-0.5 text-xs font-bold text-slate-400">
                    Cerrada
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {s._count.matches} partidos · {s._count.seasonTeams} equipos
                </p>
                {s.closedAt && (
                  <p className="text-xs text-slate-600">
                    Cerrada: {s.closedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
