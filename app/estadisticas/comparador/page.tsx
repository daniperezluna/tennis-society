import Image from "next/image";
import Link from "next/link";
import { getAllPlayersStats } from "@/lib/stats";
import { getAllSeasons, getActiveSeason } from "@/lib/season";
import { SeasonSelector } from "@/components/SeasonSelector";
import { DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";
import { ComparadorSelectors } from "@/components/ComparadorSelectors";
import type { PlayerStats, MatchEntry } from "@/lib/stats";

export const dynamic = "force-dynamic";

function DivBadge({ division }: { division: number }) {
  const c = DIVISION_COLORS[division];
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-black ${c.badgeBg} ${c.badgeText}`}>
      {DIVISION_NAMES[division]}
    </span>
  );
}

function TeamHeader({ stats, side }: { stats: PlayerStats; side: "A" | "B" }) {
  const color = side === "A" ? "text-apipana-gold" : "text-apipana-blue";
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
        {stats.team.logoUrl && (
          <Image alt={stats.team.name} className="object-cover" fill sizes="64px" src={stats.team.logoUrl} />
        )}
      </div>
      <div>
        <span className={`text-xl font-black ${color}`}>{stats.team.name}</span>
        <div className="mt-1"><DivBadge division={stats.team.division} /></div>
      </div>
    </div>
  );
}

type BarRowProps = {
  label: string;
  valueA: number;
  valueB: number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
};

function BarRow({ label, valueA, valueB, format, higherIsBetter = true }: BarRowProps) {
  const total = valueA + valueB;
  const pctA = total === 0 ? 50 : Math.round((valueA / total) * 100);
  const pctB = 100 - pctA;
  const aLeads = higherIsBetter ? valueA > valueB : valueA < valueB;
  const bLeads = higherIsBetter ? valueB > valueA : valueB < valueA;
  const fmt = format ?? ((v: number) => String(v));

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <span className={`text-right text-sm font-black ${aLeads ? "text-apipana-gold" : bLeads ? "text-slate-400" : "text-slate-300"}`}>
        {fmt(valueA)}
      </span>
      <span className="text-xs font-semibold text-slate-500 text-center w-20 shrink-0">{label}</span>
      <span className={`text-left text-sm font-black ${bLeads ? "text-apipana-blue" : aLeads ? "text-slate-400" : "text-slate-300"}`}>
        {fmt(valueB)}
      </span>
    </div>
  );
}

function CompareBar({ pctA, pctB }: { pctA: number; pctB: number }) {
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-white/5">
      <div className="h-full bg-apipana-gold/60" style={{ width: `${pctA}%` }} />
      <div className="h-full bg-apipana-blue/60" style={{ width: `${pctB}%` }} />
    </div>
  );
}

function StatSection({ label, valueA, valueB, format, higherIsBetter }: BarRowProps) {
  const total = valueA + valueB;
  const pctA = total === 0 ? 50 : Math.round((valueA / total) * 100);
  return (
    <div className="space-y-1">
      <BarRow format={format} higherIsBetter={higherIsBetter} label={label} valueA={valueA} valueB={valueB} />
      <CompareBar pctA={pctA} pctB={100 - pctA} />
    </div>
  );
}

const RADAR_LABELS = ["Ratio V", "Victorias", "Dif. Sets", "Racha max", "Racha act.", "2-0s"];

function RadarChart({
  valuesA,
  valuesB,
  nameA,
  nameB,
  size = 280,
}: {
  valuesA: number[];
  valuesB: number[];
  nameA: string;
  nameB: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const n = RADAR_LABELS.length;
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt = (val: number, i: number) => ({
    x: cx + val * r * Math.cos(angle(i)),
    y: cy + val * r * Math.sin(angle(i)),
  });
  const toPath = (vals: number[]) =>
    vals.map((v, i) => { const { x, y } = pt(v, i); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z";
  const gridLevels = [0.33, 0.67, 1.0];

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]" aria-label={`Radar chart comparando ${nameA} y ${nameB}`}>
        {/* Axis lines */}
        {RADAR_LABELS.map((_, i) => {
          const { x, y } = pt(1, i);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />;
        })}
        {/* Grid */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={RADAR_LABELS.map((_, i) => { const { x, y } = pt(level, i); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        ))}
        {/* Team B fill */}
        <path d={toPath(valuesB)} fill="rgba(20,109,167,0.18)" stroke="#146da7" strokeWidth={1.5} strokeLinejoin="round" />
        {/* Team A fill */}
        <path d={toPath(valuesA)} fill="rgba(235,176,57,0.18)" stroke="#ebb039" strokeWidth={1.5} strokeLinejoin="round" />
        {/* Dots A */}
        {valuesA.map((v, i) => { const { x, y } = pt(v, i); return <circle key={i} cx={x} cy={y} r={3} fill="#ebb039" />; })}
        {/* Dots B */}
        {valuesB.map((v, i) => { const { x, y } = pt(v, i); return <circle key={i} cx={x} cy={y} r={3} fill="#146da7" />; })}
        {/* Labels */}
        {RADAR_LABELS.map((label, i) => {
          const { x, y } = pt(1.28, i);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.45)" fontSize={9} fontWeight={700}>
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 text-xs font-bold">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-5 rounded-full bg-apipana-gold/70" />{nameA}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-5 rounded-full bg-apipana-blue/70" />{nameB}</span>
      </div>
    </div>
  );
}

function buildRadarValues(statsA: PlayerStats, statsB: PlayerStats): { valuesA: number[]; valuesB: number[] } {
  const norm = (a: number, b: number) => { const m = Math.max(a, b, 0.01); return [a / m, b / m]; };
  const [rA, rB] = norm(statsA.winRatio, statsB.winRatio);
  const [wA, wB] = norm(statsA.won, statsB.won);
  const minDS = Math.min(statsA.setsDiff, statsB.setsDiff, 0);
  const [dA, dB] = norm(statsA.setsDiff - minDS, statsB.setsDiff - minDS);
  const [sA, sB] = norm(statsA.maxWinStreak, statsB.maxWinStreak);
  const [cA, cB] = norm(Math.max(statsA.currentStreak, 0), Math.max(statsB.currentStreak, 0));
  const [tA, tB] = norm(statsA.wins20, statsB.wins20);
  return { valuesA: [rA, wA, dA, sA, cA, tA], valuesB: [rB, wB, dB, sB, cB, tB] };
}

function H2HSection({ historyA, historyB, statsA, statsB }: {
  historyA: MatchEntry[];
  historyB: MatchEntry[];
  statsA: PlayerStats;
  statsB: PlayerStats;
}) {
  const h2hA = historyA.filter((e) => e.opponentId === statsB.team.id);
  const h2hB = historyB.filter((e) => e.opponentId === statsA.team.id);
  const winsA = h2hA.filter((e) => e.result === "W").length;
  const winsB = h2hB.filter((e) => e.result === "W").length;

  const matches = [...h2hA].reverse();

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Enfrentamientos directos
      </p>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500">No se han enfrentado aún en liga.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-4xl font-black text-apipana-gold">{winsA}</p>
              <p className="text-xs text-slate-400">{statsA.team.name}</p>
            </div>
            <p className="text-slate-600 font-black text-2xl">vs</p>
            <div>
              <p className="text-4xl font-black text-apipana-blue">{winsB}</p>
              <p className="text-xs text-slate-400">{statsB.team.name}</p>
            </div>
          </div>
          <div className="divide-y divide-white/5 rounded-2xl border border-white/8 overflow-hidden">
            {matches.map((e) => {
              const aWon = e.result === "W";
              return (
                <div key={e.matchId} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className={`font-semibold ${aWon ? "text-apipana-gold" : "text-slate-400"}`}>
                    {statsA.team.name}
                  </span>
                  <span className="font-black tabular-nums text-slate-300">
                    {e.ownSets}–{e.rivalSets}
                  </span>
                  <span className={`font-semibold ${!aWon ? "text-apipana-blue" : "text-slate-400"}`}>
                    {statsB.team.name}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default async function ComparadorPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; season?: string }>;
}) {
  const [sp, seasons, activeSeason] = await Promise.all([
    searchParams,
    getAllSeasons(),
    getActiveSeason().catch(() => null),
  ]);

  const seasonParam = sp.season;
  const seasonId = seasonParam === "all" ? 0 : seasonParam ? parseInt(seasonParam) || undefined : undefined;
  const currentSelector = seasonParam === "all" ? "all" : seasonParam ?? "active";

  const allStats = await getAllPlayersStats(seasonId);

  const idA = parseInt(sp.a ?? "") || null;
  const idB = parseInt(sp.b ?? "") || null;

  const statsA = idA ? allStats.find((s) => s.team.id === idA) ?? null : null;
  const statsB = idB ? allStats.find((s) => s.team.id === idB) ?? null : null;

  const teamOptions = allStats.map((s) => ({
    id: s.team.id,
    name: s.team.name,
    division: s.team.division,
  }));

  const showComparison = statsA !== null && statsB !== null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-apipana-gold transition-colors"
            href="/estadisticas"
          >
            ← Estadísticas
          </Link>
          <SeasonSelector activeSeason={activeSeason} current={currentSelector} seasons={seasons} />
        </div>
        <h1 className="mt-4 text-4xl font-black gradient-text">Comparador</h1>
        <p className="mt-1 text-slate-400">Compara las estadísticas de dos jugadores cara a cara.</p>
      </div>

      <div className="glass rounded-3xl p-6">
        <ComparadorSelectors idA={idA} idB={idB} teams={teamOptions} />
      </div>

      {!showComparison && (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-slate-400">Selecciona dos jugadores para ver la comparativa.</p>
        </div>
      )}

      {showComparison && (
        <>
          {/* Headers */}
          <section className="glass rounded-3xl p-6">
            <div className="grid grid-cols-3 items-center gap-4">
              <TeamHeader side="A" stats={statsA} />
              <div className="text-center text-slate-600 font-black text-2xl">vs</div>
              <TeamHeader side="B" stats={statsB} />
            </div>
          </section>

          {/* Radar chart */}
          <section className="glass rounded-3xl p-6">
            <h2 className="mb-5 text-lg font-black text-slate-200">Perfil comparado</h2>
            <RadarChart
              {...buildRadarValues(statsA, statsB)}
              nameA={statsA.team.name}
              nameB={statsB.team.name}
            />
          </section>

          {/* Stats comparison */}
          <section className="glass rounded-3xl p-6 space-y-5">
            <h2 className="text-lg font-black text-slate-200">Estadísticas</h2>
            <StatSection label="Jugados" valueA={statsA.played} valueB={statsB.played} />
            <StatSection label="Victorias" valueA={statsA.won} valueB={statsB.won} />
            <StatSection label="Derrotas" higherIsBetter={false} valueA={statsA.lost} valueB={statsB.lost} />
            <StatSection
              format={(v) => `${v}%`}
              label="Ratio V"
              valueA={Math.round(statsA.winRatio * 100)}
              valueB={Math.round(statsB.winRatio * 100)}
            />
            <StatSection
              format={(v) => (v >= 0 ? `+${v}` : String(v))}
              label="Dif. sets"
              valueA={statsA.setsDiff + Math.abs(Math.min(statsA.setsDiff, statsB.setsDiff))}
              valueB={statsB.setsDiff + Math.abs(Math.min(statsA.setsDiff, statsB.setsDiff))}
            />
            <StatSection label="Sets ganados" valueA={statsA.setsWon} valueB={statsB.setsWon} />
            <StatSection
              label="Racha actual"
              valueA={Math.max(statsA.currentStreak, 0)}
              valueB={Math.max(statsB.currentStreak, 0)}
            />
            <StatSection label="Max. racha +" valueA={statsA.maxWinStreak} valueB={statsB.maxWinStreak} />
          </section>

          {/* H2H */}
          <section className="glass rounded-3xl p-6">
            <H2HSection
              historyA={statsA.matchHistory}
              historyB={statsB.matchHistory}
              statsA={statsA}
              statsB={statsB}
            />
          </section>
        </>
      )}
    </main>
  );
}