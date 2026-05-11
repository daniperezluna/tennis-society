import { AdminNav } from "@/components/AdminNav";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StatusBadge } from "@/components/StatusBadge";
import prisma from "@/lib/prisma";
import { CUP_ROUND_LABELS, CUP_ROUNDS } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import {
  createCupMatch,
  deleteCupMatch,
  generateCup,
  resetCup,
  updateCupMatchResult,
  updateCupMatchTeams,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function CopaAdminPage() {
  await requireAdmin();
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ division: "asc" }, { name: "asc" }] }),
    prisma.cupMatch.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ round: "asc" }, { order: "asc" }],
    }),
    prisma.team.findMany({ where: { cupEnabled: true } }),
  ]);
  const activeRounds = CUP_ROUNDS.filter((round) =>
    matches.some((match) => match.round === round),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-amber-300">
            Partidos de copa
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={resetCup}>
            <ConfirmButton
              className="rounded-full border border-red-300/40 bg-red-950/40 px-5 py-3 font-black text-red-100"
              message="Esto borrará toda la copa. ¿Seguro?"
            >
              Resetear copa
            </ConfirmButton>
          </form>
          <form action={generateCup}>
            <ConfirmButton
              className="rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300 px-5 py-3 font-black text-slate-950 shadow-lg shadow-fuchsia-500/20"
              message="Esto borrará la copa actual y sorteará una nueva. ¿Continuar?"
            >
              Sortear nueva copa
            </ConfirmButton>
          </form>
        </div>
      </div>

      <details className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <summary className="cursor-pointer list-none text-lg font-black text-slate-100">
          Crear partido manual
        </summary>
        <form
          action={createCupMatch}
          className="mt-4 grid gap-3 md:grid-cols-4"
        >
          <select
            className="rounded-xl bg-black/30 px-3 py-2"
            name="round"
            required
          >
            {CUP_ROUNDS.map((r) => (
              <option key={r} value={r}>
                {CUP_ROUND_LABELS[r]}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl bg-black/30 px-3 py-2"
            name="order"
            placeholder="Orden"
            type="number"
            min="0"
            defaultValue="0"
          />
          <select
            className="rounded-xl bg-black/30 px-3 py-2"
            name="homeTeamId"
          >
            <option value="">Por definir</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl bg-black/30 px-3 py-2"
            name="awayTeamId"
          >
            <option value="">Por definir</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-amber-300 px-3 py-2 font-black text-slate-950 md:col-span-4">
            Crear
          </button>
        </form>
      </details>

      <div className="mt-6 space-y-5">
        {activeRounds.map((round) => (
          <section
            className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
            key={round}
          >
            <h2 className="mb-3 text-2xl font-black text-amber-300">
              {CUP_ROUND_LABELS[round]}
            </h2>
            <div className="space-y-3">
              {matches
                .filter((match) => match.round === round)
                .map((match) => {
                  const homeName = match.homeTeam?.name ?? "Por definir";
                  const awayName =
                    match.awayTeam?.name ??
                    (match.homeTeam ? "Pasa directo" : "Por definir");
                  const canPlay = Boolean(match.homeTeamId && match.awayTeamId);
                  const homeWon =
                    match.status === "played" &&
                    (match.homeSets ?? 0) > (match.awaySets ?? 0);
                  const awayWon =
                    match.status === "played" &&
                    (match.awaySets ?? 0) > (match.homeSets ?? 0);

                  return (
                    <article
                      className="rounded-2xl border border-white/10 bg-white/7 p-4"
                      key={match.id}
                    >
                      <div className="grid gap-3 lg:grid-cols-[1fr_80px_1fr_120px_auto] lg:items-center">
                        <p
                          className={`truncate text-lg font-black ${homeWon ? "text-emerald-300" : "text-white"}`}
                        >
                          {homeName}
                        </p>
                        <p className="text-center text-2xl font-black text-amber-300">
                          {match.homeSets ?? "-"}:{match.awaySets ?? "-"}
                        </p>
                        <p
                          className={`truncate text-lg font-black lg:text-right ${awayWon ? "text-emerald-300" : "text-white"}`}
                        >
                          {awayName}
                        </p>
                        <StatusBadge status={match.status} />
                        <form action={deleteCupMatch}>
                          <input name="id" type="hidden" value={match.id} />
                          <ConfirmButton
                            className="rounded-full border border-red-300/40 px-3 py-2 text-sm text-red-200"
                            message="¿Eliminar este partido de copa?"
                          >
                            Eliminar
                          </ConfirmButton>
                        </form>
                      </div>

                      <details className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                        <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-slate-400">
                          Editar equipos
                        </summary>
                        <form
                          action={updateCupMatchTeams}
                          className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                        >
                          <input name="id" type="hidden" value={match.id} />
                          <select
                            className="rounded-lg bg-black/40 px-3 py-2 text-sm"
                            defaultValue={match.homeTeamId ?? ""}
                            name="homeTeamId"
                          >
                            <option value="">Por definir</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="rounded-lg bg-black/40 px-3 py-2 text-sm"
                            defaultValue={match.awayTeamId ?? ""}
                            name="awayTeamId"
                          >
                            <option value="">Por definir</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <ConfirmButton
                            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-black text-slate-950"
                            message="Cambiar los equipos resetea el resultado y borra los avances posteriores. ¿Continuar?"
                          >
                            Guardar
                          </ConfirmButton>
                        </form>
                      </details>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {canPlay ? (
                          [
                            ["2-0", `${homeName} 2-0`],
                            ["2-1", `${homeName} 2-1`],
                            ["1-2", `${awayName} 2-1`],
                            ["0-2", `${awayName} 2-0`],
                          ].map(([score, label]) => (
                            <form action={updateCupMatchResult} key={score}>
                              <input name="id" type="hidden" value={match.id} />
                              <button
                                className="rounded-full bg-emerald-300 px-3 py-2 text-sm font-black text-slate-950"
                                name="score"
                                type="submit"
                                value={score}
                              >
                                {label}
                              </button>
                            </form>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">
                            Esperando rivales.
                          </p>
                        )}
                        {canPlay && (
                          <>
                            <form action={updateCupMatchResult}>
                              <input name="id" type="hidden" value={match.id} />
                              <button
                                className="rounded-full border border-rose-300/40 bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-100"
                                name="score"
                                type="submit"
                                value="wo-home"
                              >
                                W/O · {homeName}
                              </button>
                            </form>
                            <form action={updateCupMatchResult}>
                              <input name="id" type="hidden" value={match.id} />
                              <button
                                className="rounded-full border border-rose-300/40 bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-100"
                                name="score"
                                type="submit"
                                value="wo-away"
                              >
                                W/O · {awayName}
                              </button>
                            </form>
                          </>
                        )}
                        <form action={updateCupMatchResult}>
                          <input name="id" type="hidden" value={match.id} />
                          <button
                            className="rounded-full border border-white/15 px-3 py-2 text-sm font-bold text-slate-200"
                            name="score"
                            type="submit"
                            value="pending"
                          >
                            Pendiente
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
