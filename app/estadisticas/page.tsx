import Image from "next/image";
import Link from "next/link";
import { getAllPlayersStats, getDivisionHeatmap, getContestedMatches } from "@/lib/stats";
import { getAllSeasons, getActiveSeason } from "@/lib/season";
import { SeasonSelector } from "@/components/SeasonSelector";
import { DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";
import type { HeatmapData, PlayerStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

function Logo({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10">
      {src ? <Image alt={name} className="object-cover" fill src={src} sizes="28px" /> : null}
    </div>
  );
}

function DivBadge({ division }: { division: number }) {
  const c = DIVISION_COLORS[division];
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-black ${c.badgeBg} ${c.badgeText}`}>
      {DIVISION_NAMES[division]}
    </span>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span className="text-slate-500 text-xs font-semibold">—</span>;
  const isWin = streak > 0;
  const isHot = isWin && streak >= 3;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-black ${
      isHot
        ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40"
        : isWin
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
    }`}>
      {isHot && <span aria-hidden="true" className="text-[10px]">🔥</span>}
      {isWin ? `+${streak}` : streak}
    </span>
  );
}

function HeatmapTable({ teams, matrix }: HeatmapData) {
  if (teams.length === 0) return <p className="text-sm text-slate-500 p-4">Sin datos aún.</p>;
  return (
    <div className="overflow-x-auto p-4">
      <table className="text-xs w-full">
        <thead>
          <tr>
            <th className="text-left pb-2 pr-3 text-slate-500 font-semibold min-w-20">↓ vs →</th>
            {teams.map((t) => (
              <th key={t.id} className="text-center pb-2 px-1 text-slate-400 font-semibold min-w-10" title={t.name}>
                {t.name.slice(0, 6)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((row, i) => (
            <tr key={row.id} className="border-t border-white/5">
              <td className="py-1.5 pr-3 text-slate-300 font-semibold truncate max-w-24">{row.name}</td>
              {teams.map((col, j) => {
                if (i === j) {
                  return <td key={col.id} className="py-1.5 px-1 text-center text-slate-700 text-base">—</td>;
                }
                const wins = matrix[i][j];
                const losses = matrix[j][i];
                const played = wins + losses;
                let cellCls = "text-slate-700";
                if (played > 0) {
                  if (wins > losses) cellCls = wins === 2 ? "bg-emerald-500/25 text-emerald-300 font-black rounded" : "bg-emerald-500/10 text-emerald-400 font-black rounded";
                  else if (wins < losses) cellCls = losses === 2 ? "bg-red-500/25 text-red-300 font-black rounded" : "bg-red-500/10 text-red-400 font-black rounded";
                  else cellCls = "bg-yellow-500/10 text-yellow-400 font-black rounded";
                }
                return (
                  <td key={col.id} className="py-1.5 px-1 text-center">
                    <span className={`inline-block min-w-5 px-1 text-xs ${cellCls}`}>
                      {played === 0 ? "·" : wins}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "short" }).format(d);
}

function SoSBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full bg-apipana-blue/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-xs text-slate-400">{value.toFixed(2)}</span>
    </div>
  );
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const [sp, seasons, activeSeason] = await Promise.all([
    searchParams,
    getAllSeasons(),
    getActiveSeason().catch(() => null),
  ]);

  const seasonParam = sp.season; // undefined = active, "all" = career, "<id>" = specific
  const seasonId = seasonParam === "all" ? 0 : seasonParam ? parseInt(seasonParam) || undefined : undefined;
  const currentSelector = seasonParam === "all" ? "all" : seasonParam ?? "active";

  const [allStats, contested, heatmap1, heatmap2, heatmap3] = await Promise.all([
    getAllPlayersStats(seasonId),
    getContestedMatches(15, seasonId),
    getDivisionHeatmap(1, seasonId),
    getDivisionHeatmap(2, seasonId),
    getDivisionHeatmap(3, seasonId),
  ]);

  const heatmaps = [heatmap1, heatmap2, heatmap3];

  // Highlights
  const topWinner = allStats[0] ?? null;
  const bestRatio = [...allStats].filter((s) => s.played >= 3).sort((a, b) => b.winRatio - a.winRatio)[0] ?? null;
  const longestStreak = [...allStats].sort((a, b) => b.maxWinStreak - a.maxWinStreak)[0] ?? null;
  const biggestDS = [...allStats].sort((a, b) => b.setsDiff - a.setsDiff)[0] ?? null;

  // Rankings
  const byDS = [...allStats].sort((a, b) => b.setsDiff - a.setsDiff);
  const byStreak = [...allStats].sort((a, b) => b.maxWinStreak - a.maxWinStreak);
  const bySoS = [...allStats].filter((s) => s.scheduleStrength > 0).sort((a, b) => a.scheduleStrength - b.scheduleStrength);
  const maxSoS = Math.max(...bySoS.map((s) => s.scheduleStrength), 1);

  const highlights: { label: string; value: string; sub: string; color: string }[] = [
    topWinner
      ? { label: "Más victorias", value: topWinner.team.name, sub: `${topWinner.won} victorias`, color: "text-apipana-gold" }
      : { label: "Más victorias", value: "—", sub: "Sin datos", color: "text-slate-500" },
    bestRatio
      ? { label: "Mejor ratio", value: bestRatio.team.name, sub: `${(bestRatio.winRatio * 100).toFixed(0)}% de victorias`, color: "text-emerald-400" }
      : { label: "Mejor ratio", value: "—", sub: "Sin datos (mín. 3 jugados)", color: "text-slate-500" },
    longestStreak
      ? { label: "Racha más larga", value: longestStreak.team.name, sub: `${longestStreak.maxWinStreak} victorias seguidas`, color: "text-apipana-blue" }
      : { label: "Racha más larga", value: "—", sub: "Sin datos", color: "text-slate-500" },
    biggestDS
      ? { label: "Mayor +DS", value: biggestDS.team.name, sub: `+${biggestDS.setsDiff} sets`, color: "text-amber-400" }
      : { label: "Mayor +DS", value: "—", sub: "Sin datos", color: "text-slate-500" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="pb-2 text-6xl font-black leading-tight gradient-text">Stats</h1>
          <p className="mt-1 text-slate-400">Cifras y récords de la temporada.</p>
        </div>
        <SeasonSelector activeSeason={activeSeason} current={currentSelector} seasons={seasons} />
      </div>

      {/* Highlights */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {highlights.map((h) => (
          <div className="glass rounded-3xl p-6" key={h.label}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{h.label}</p>
            <p className={`mt-2 text-2xl font-black truncate ${h.color}`}>{h.value}</p>
            <p className="mt-1 text-sm text-slate-400">{h.sub}</p>
          </div>
        ))}
      </section>

      {/* Ranking DS + Rachas */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Ranking por diferencia de sets */}
        <article className="glass overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-black text-slate-200">Ranking por diferencia de sets</h2>
            <p className="text-xs text-slate-500 mt-0.5">Clasificación alternativa ordenada por DS</p>
          </div>
          <div className="overflow-x-auto">
            <table className="score-table w-full table-fixed text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="w-8 text-center sm:w-10">#</th>
                  <th className="text-left">Equipo</th>
                  <th className="w-10 text-center">Div</th>
                  <th className="w-12 text-center" title="Diferencia de sets">DS</th>
                  <th className="w-8 text-center">G</th>
                  <th className="w-8 text-center">P</th>
                </tr>
              </thead>
              <tbody>
                {byDS.map((s, pos) => (
                  <tr key={s.team.id}>
                    <td className="text-center text-slate-500 text-xs">{pos + 1}</td>
                    <td>
                      <Link href={`/estadisticas/${s.team.id}`} className="flex min-w-0 items-center gap-2 hover:text-apipana-gold transition-colors">
                        <Logo name={s.team.name} src={s.team.logoUrl} />
                        <span className="min-w-0 truncate font-semibold">{s.team.name}</span>
                      </Link>
                    </td>
                    <td className="text-center"><DivBadge division={s.team.division} /></td>
                    <td className="text-center font-semibold text-slate-300 tabular-nums">
                      {s.setsDiff > 0 ? `+${s.setsDiff}` : s.setsDiff}
                    </td>
                    <td className="text-center text-slate-400">{s.won}</td>
                    <td className="text-center text-slate-400">{s.lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Rachas históricas */}
        <article className="glass overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-black text-slate-200">Rachas históricas</h2>
            <p className="text-xs text-slate-500 mt-0.5">Mejores y peores rachas de la temporada</p>
          </div>
          <div className="overflow-x-auto">
            <table className="score-table w-full text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="text-left">Equipo</th>
                  <th className="w-10 text-center">Div</th>
                  <th className="w-16 text-center" title="Racha máxima ganadora">Max +</th>
                  <th className="w-16 text-center" title="Racha máxima perdedora">Max −</th>
                  <th className="w-16 text-center">Ahora</th>
                </tr>
              </thead>
              <tbody>
                {byStreak.map((s) => (
                  <tr key={s.team.id}>
                    <td>
                      <Link href={`/estadisticas/${s.team.id}`} className="flex min-w-0 items-center gap-2 hover:text-apipana-gold transition-colors">
                        <Logo name={s.team.name} src={s.team.logoUrl} />
                        <span className="min-w-0 truncate font-semibold">{s.team.name}</span>
                      </Link>
                    </td>
                    <td className="text-center"><DivBadge division={s.team.division} /></td>
                    <td className="text-center">
                      <span className="font-black text-emerald-400">{s.maxWinStreak > 0 ? `+${s.maxWinStreak}` : "—"}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-black text-red-400">{s.maxLoseStreak > 0 ? `−${s.maxLoseStreak}` : "—"}</span>
                    </td>
                    <td className="text-center"><StreakBadge streak={s.currentStreak} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* Partidos más reñidos */}
      <article className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-200">Partidos más reñidos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Últimos {contested.length} partidos decididos por 2-1</p>
          </div>
        </div>
        {contested.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aún no hay partidos reñidos registrados.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {contested.map((m) => {
              const homeWon = m.homeSets > m.awaySets;
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <DivBadge division={m.division} />
                  {m.matchday && <span className="text-xs text-slate-600">J{m.matchday}</span>}
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className={`truncate font-semibold ${homeWon ? "text-white" : "text-slate-400"}`}>{m.homeName}</span>
                    <span className="shrink-0 font-black text-slate-300 tabular-nums">{m.homeSets}–{m.awaySets}</span>
                    <span className={`truncate font-semibold ${!homeWon ? "text-white" : "text-slate-400"}`}>{m.awayName}</span>
                  </div>
                  <span className="shrink-0 text-xs text-slate-600">{formatDate(m.playedAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* Mapas de calor */}
      <section>
        <h2 className="mb-4 text-xl font-black text-slate-200">Mapa de calor H2H</h2>
        <p className="text-xs text-slate-500 mb-4">Victorias del equipo fila contra el equipo columna. Verde = ventaja, rojo = desventaja, amarillo = igualado.</p>
        <div className="grid gap-6 xl:grid-cols-3">
          {heatmaps.map((hm, i) => (
            <article className="glass overflow-hidden rounded-3xl" key={i}>
              <div className={`border-b border-white/10 px-5 py-4 flex items-center gap-3`}>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${DIVISION_COLORS[i + 1].badgeBg} ${DIVISION_COLORS[i + 1].badgeText}`}>
                  {DIVISION_NAMES[i + 1]}
                </span>
                <h3 className={`text-base font-black ${DIVISION_COLORS[i + 1].text}`}>División {i + 1}</h3>
              </div>
              <HeatmapTable matrix={hm.matrix} teams={hm.teams} />
            </article>
          ))}
        </div>
      </section>

      {/* Índice de dificultad del calendario */}
      {bySoS.length > 0 && (
        <article className="glass overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-black text-slate-200">Índice de dificultad del calendario</h2>
            <p className="text-xs text-slate-500 mt-0.5">Rango promedio de los rivales enfrentados (menor = rivales más duros)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="score-table w-full text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="text-left">Equipo</th>
                  <th className="w-10 text-center">Div</th>
                  <th className="w-10 text-center">J</th>
                  <th className="text-left pl-4">Nivel de rivales</th>
                </tr>
              </thead>
              <tbody>
                {bySoS.map((s) => (
                  <tr key={s.team.id}>
                    <td>
                      <Link href={`/estadisticas/${s.team.id}`} className="flex min-w-0 items-center gap-2 hover:text-apipana-gold transition-colors">
                        <Logo name={s.team.name} src={s.team.logoUrl} />
                        <span className="min-w-0 truncate font-semibold">{s.team.name}</span>
                      </Link>
                    </td>
                    <td className="text-center"><DivBadge division={s.team.division} /></td>
                    <td className="text-center text-slate-400">{s.matchHistory.length}</td>
                    <td className="pl-4"><SoSBar max={maxSoS} value={s.scheduleStrength} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Grid de jugadores */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-200">Perfiles de jugadores</h2>
          <Link
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-apipana-gold"
            href="/estadisticas/comparador"
          >
            Comparador →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(allStats as PlayerStats[]).map((s) => (
            <Link
              key={s.team.id}
              href={`/estadisticas/${s.team.id}`}
              className="card-hover glass flex items-center gap-3 rounded-2xl p-4"
            >
              <Logo name={s.team.name} src={s.team.logoUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-white">{s.team.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <DivBadge division={s.team.division} />
                  <span className="text-xs text-slate-400">{s.won}V {s.lost}D</span>
                </div>
              </div>
              <StreakBadge streak={s.currentStreak} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}