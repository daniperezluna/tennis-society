import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPlayersStats, getMatchdayProgression } from "@/lib/stats";
import { DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";
import type { ProgressionSeries, MatchEntry } from "@/lib/stats";

export const dynamic = "force-dynamic";

function Logo({ src, name, size = 12 }: { src?: string | null; name: string; size?: number }) {
  const dim = `${size * 4}px`;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10"
      style={{ width: dim, height: dim }}
    >
      {src ? <Image alt={name} className="object-cover" fill src={src} sizes={dim} /> : null}
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

function ProgressionChart({
  series,
  highlightTeamId,
}: {
  series: ProgressionSeries[];
  highlightTeamId: number;
}) {
  const validSeries = series.filter((s) => s.points.length >= 2);
  if (validSeries.length === 0) return null;

  const maxMatchdays = Math.max(...validSeries.map((s) => s.points.length));
  const maxPoints = Math.max(...validSeries.flatMap((s) => s.points), 1);

  const W = 600;
  const H = 100;
  const PAD = { t: 12, r: 12, b: 22, l: 28 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const xPos = (i: number) =>
    PAD.l + (maxMatchdays > 1 ? (i / (maxMatchdays - 1)) * cW : cW / 2);
  const yPos = (p: number) => PAD.t + cH - (p / maxPoints) * cH;

  const pathD = (points: number[]) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(p).toFixed(1)}`)
      .join(" ");

  const highlighted = validSeries.find((s) => s.teamId === highlightTeamId);
  const others = validSeries.filter((s) => s.teamId !== highlightTeamId);
  const yLabels = [...new Set([0, Math.round(maxPoints / 2), maxPoints])];

  return (
    <svg
      aria-label="Progresión de puntos por jornada"
      className="w-full"
      style={{ height: 120 }}
      viewBox={`0 0 ${W} ${H}`}
    >
      {yLabels.map((v) => (
        <g key={v}>
          <line
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={yPos(v)}
            y2={yPos(v)}
          />
          <text
            fill="rgba(255,255,255,0.25)"
            fontSize={9}
            textAnchor="end"
            x={PAD.l - 4}
            y={yPos(v) + 3}
          >
            {v}
          </text>
        </g>
      ))}
      {Array.from({ length: maxMatchdays }, (_, i) => (
        <text
          fill="rgba(255,255,255,0.25)"
          fontSize={9}
          key={i}
          textAnchor="middle"
          x={xPos(i)}
          y={H - 4}
        >
          {i + 1}
        </text>
      ))}
      {others.map((s) => (
        <path
          d={pathD(s.points)}
          fill="none"
          key={s.teamId}
          stroke="rgba(255,255,255,0.10)"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      ))}
      {highlighted && (
        <path
          d={pathD(highlighted.points)}
          fill="none"
          stroke="#ebb039"
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
      )}
    </svg>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function ResultScore({ ownSets, rivalSets }: { ownSets: number; rivalSets: number }) {
  const won = ownSets > rivalSets;
  return (
    <span className={`tabular-nums font-black text-sm ${won ? "text-emerald-400" : "text-red-400"}`}>
      {ownSets}–{rivalSets}
    </span>
  );
}

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es", { dateStyle: "short" }).format(d);
}

export default async function PlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const teamId = parseInt(params.id);
  if (isNaN(teamId)) notFound();

  const allStats = await getAllPlayersStats();
  const stats = allStats.find((s) => s.team.id === teamId);
  if (!stats) notFound();

  const progression = await getMatchdayProgression(stats.team.division);

  // H2H vs each opponent in same division
  const divisionOpponents = allStats.filter(
    (s) => s.team.division === stats.team.division && s.team.id !== teamId
  );

  const h2hMap = new Map<number, { wins: number; losses: number; entries: MatchEntry[] }>();
  for (const opp of divisionOpponents) {
    h2hMap.set(opp.team.id, { wins: 0, losses: 0, entries: [] });
  }
  for (const entry of stats.matchHistory) {
    const bucket = h2hMap.get(entry.opponentId);
    if (!bucket) continue;
    bucket.entries.push(entry);
    if (entry.result === "W") bucket.wins++;
    else bucket.losses++;
  }

  // Recent history (reversed = most recent first)
  const recentHistory = [...stats.matchHistory].reverse().slice(0, 20);

  const divColor = DIVISION_COLORS[stats.team.division];
  const winBarPct = stats.won > 0 ? (stats.wins20 / stats.won) * 100 : 0;
  const loseBarPct = stats.lost > 0 ? (stats.losses02 / stats.lost) * 100 : 0;

  const streakLabel =
    stats.currentStreak === 0
      ? "—"
      : stats.currentStreak > 0
        ? `+${stats.currentStreak} victorias`
        : `${stats.currentStreak * -1} derrotas`;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 flex flex-col gap-8">
      {/* Breadcrumb */}
      <Link
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-apipana-gold transition-colors"
        href="/estadisticas"
      >
        ← Estadísticas
      </Link>

      {/* Header */}
      <section className="glass rounded-3xl p-6 flex items-center gap-5">
        <Logo name={stats.team.name} size={16} src={stats.team.logoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <DivBadge division={stats.team.division} />
            <Link
              className="text-sm font-semibold text-slate-400 hover:text-apipana-gold transition-colors"
              href={`/estadisticas/comparador?a=${teamId}`}
            >
              Comparar →
            </Link>
          </div>
          <h1 className={`text-4xl font-black ${divColor.text}`}>{stats.team.name}</h1>
        </div>
      </section>

      {/* Stats clave */}
      <section className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatCard label="Jugados" value={String(stats.played)} />
        <StatCard label="Victorias" value={String(stats.won)} />
        <StatCard label="Derrotas" value={String(stats.lost)} />
        <StatCard
          label="Ratio"
          value={`${(stats.winRatio * 100).toFixed(0)}%`}
          sub={stats.played < 3 ? "poca muestra" : undefined}
        />
        <StatCard
          label="DS"
          value={stats.setsDiff > 0 ? `+${stats.setsDiff}` : String(stats.setsDiff)}
        />
        <StatCard label="Racha" value={streakLabel} />
      </section>

      {/* Desglose W/L */}
      {(stats.won > 0 || stats.lost > 0) && (
        <section className="glass rounded-3xl p-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Victorias ({stats.won})
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-emerald-400/60" style={{ width: `${winBarPct}%` }} />
                </div>
                <span className="w-20 text-xs text-slate-300 shrink-0">
                  {stats.wins20} por 2-0
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${100 - winBarPct}%` }} />
                </div>
                <span className="w-20 text-xs text-slate-300 shrink-0">
                  {stats.wins21} por 2-1
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Derrotas ({stats.lost})
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-red-400/60" style={{ width: `${loseBarPct}%` }} />
                </div>
                <span className="w-20 text-xs text-slate-300 shrink-0">
                  {stats.losses02} por 0-2
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-yellow-500/60" style={{ width: `${100 - loseBarPct}%` }} />
                </div>
                <span className="w-20 text-xs text-slate-300 shrink-0">
                  {stats.losses12} por 1-2
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Progresión en liga */}
      {progression.some((s) => s.points.length >= 2) && (
        <article className="glass rounded-3xl p-6">
          <h2 className="mb-1 text-lg font-black text-slate-200">Progresión en liga</h2>
          <p className="mb-4 text-xs text-slate-500">Puntos acumulados por jornada. Línea dorada = este jugador.</p>
          <ProgressionChart highlightTeamId={teamId} series={progression} />
          <div className="mt-3 flex flex-wrap gap-3">
            {progression.map((s) => (
              <div key={s.teamId} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-6 rounded-full"
                  style={{ backgroundColor: s.teamId === teamId ? "#ebb039" : "rgba(255,255,255,0.15)" }}
                />
                <span className="text-xs text-slate-400">{s.name}</span>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* H2H vs rivales de división */}
      {divisionOpponents.length > 0 && (
        <article className="glass overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-black text-slate-200">Head to head en división</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="score-table w-full text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="text-left">Rival</th>
                  <th className="w-10 text-center">G</th>
                  <th className="w-10 text-center">P</th>
                  <th className="w-20 text-center">Sets G</th>
                  <th className="w-20 text-center">Sets P</th>
                  <th className="text-center">Forma</th>
                </tr>
              </thead>
              <tbody>
                {divisionOpponents.map((opp) => {
                  const h2h = h2hMap.get(opp.team.id) ?? { wins: 0, losses: 0, entries: [] };
                  const oppSetsWon = h2h.entries.reduce((a, e) => a + e.ownSets, 0);
                  const oppSetsLost = h2h.entries.reduce((a, e) => a + e.rivalSets, 0);
                  return (
                    <tr key={opp.team.id}>
                      <td>
                        <Link
                          className="flex items-center gap-2 hover:text-apipana-gold transition-colors"
                          href={`/estadisticas/${opp.team.id}`}
                        >
                          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-lg bg-white/10">
                            {opp.team.logoUrl && (
                              <Image alt={opp.team.name} className="object-cover" fill sizes="24px" src={opp.team.logoUrl} />
                            )}
                          </div>
                          <span className="font-semibold truncate">{opp.team.name}</span>
                        </Link>
                      </td>
                      <td className="text-center font-black text-emerald-400">{h2h.wins}</td>
                      <td className="text-center font-black text-red-400">{h2h.losses}</td>
                      <td className="text-center text-slate-400">{oppSetsWon}</td>
                      <td className="text-center text-slate-400">{oppSetsLost}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {h2h.entries.map((e, i) => (
                            <FormBadge key={i} opponentName={opp.team.name} result={e.result} tight={e.tight} />
                          ))}
                          {h2h.entries.length === 0 && <span className="text-slate-600 text-xs">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Historial de partidos */}
      {recentHistory.length > 0 && (
        <article className="glass overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-black text-slate-200">Historial de partidos</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentHistory.map((entry) => {
              const scoreStr = `${entry.ownSets}–${entry.rivalSets}`;
              const date = formatDate(entry.playedAt);
              return (
                <div key={entry.matchId} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <DivBadge division={entry.division} />
                  {entry.matchday && (
                    <span className="text-xs text-slate-600 shrink-0">J{entry.matchday}</span>
                  )}
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className="text-slate-400 text-xs shrink-0">vs</span>
                    <span className="font-semibold truncate">{entry.opponentName}</span>
                  </div>
                  <ResultScore ownSets={entry.ownSets} rivalSets={entry.rivalSets} />
                  <span className="hidden sm:block text-xs text-slate-600 shrink-0 w-16 text-right">
                    {date ?? ""}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      )}
    </main>
  );
}