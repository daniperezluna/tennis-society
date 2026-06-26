import Image from "next/image";
import type { CupMatchModel, TeamModel } from "@/app/generated/prisma/models";
import prisma from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { CupChampionBanner } from "@/components/CupChampionBanner";
import { CUP_ROUND_LABELS, CUP_ROUND_ORDER, CUP_ROUNDS } from "@/lib/constants";
import { realR0Indices } from "@/lib/cup";
import { getActiveSeason } from "@/lib/season";

export const dynamic = "force-dynamic";

type CupMatchFull = CupMatchModel & { homeTeam: TeamModel | null; awayTeam: TeamModel | null };

function Logo({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10">
      {src ? <Image alt={name} className="object-cover" fill src={src} sizes="28px" /> : null}
    </div>
  );
}

function TeamRow({
  name,
  logoUrl,
  sets,
  isWinner,
  isTbd,
  isWalkover,
}: {
  name: string | null;
  logoUrl?: string | null;
  sets: number | null;
  isWinner: boolean;
  isTbd: boolean;
  isWalkover?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors ${
        isWinner ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/25" : "bg-black/30"
      }`}
    >
      <span className={`flex min-w-0 items-center gap-2 ${isTbd ? "opacity-40" : ""}`}>
        <Logo name={name ?? "?"} src={logoUrl} />
        <span className={`min-w-0 truncate text-sm ${isTbd ? "italic text-slate-500" : "font-semibold text-white"}`}>
          {name ?? "Por definir"}
        </span>
      </span>
      <strong
        className={`shrink-0 tabular-nums text-base font-black ${
          isWinner ? "text-emerald-300" : isTbd ? "text-slate-700" : "text-amber-300"
        }`}
      >
        {isTbd ? "-" : isWalkover ? (isWinner ? "W" : "—") : (sets ?? "-")}
      </strong>
    </div>
  );
}

function MatchSlot({
  match,
  slotIndex,
  isFirstRound,
  isLastRound,
  isLone,
  flexValue,
}: {
  match: CupMatchFull;
  slotIndex: number;
  isFirstRound: boolean;
  isLastRound: boolean;
  isLone: boolean;
  flexValue: number;
}) {
  const decided = match.status === "played" || match.status === "walkover";
  const homeWon = decided && (match.homeSets ?? 0) > (match.awaySets ?? 0);
  const awayWon = decided && (match.awaySets ?? 0) > (match.homeSets ?? 0);
  const isWalkover = match.status === "walkover";
  const isBye = !!match.homeTeam && !match.awayTeam && isFirstRound;
  const isUpper = slotIndex % 2 === 0;

  return (
    <div className="relative flex items-center px-3" style={{ flex: flexValue }}>
      {!isFirstRound && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 h-px w-3 bg-white/15"
        />
      )}
      <article className="card-hover relative w-full rounded-xl border border-white/10 bg-white/5 p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Partido {match.order}
          </span>
          <StatusBadge status={match.status} />
        </div>
        <div className="space-y-1.5">
          <TeamRow
            name={match.homeTeam?.name ?? null}
            logoUrl={match.homeTeam?.logoUrl}
            sets={match.homeSets}
            isWinner={homeWon}
            isTbd={!match.homeTeam}
            isWalkover={isWalkover}
          />
          <TeamRow
            name={isBye ? "Pasa directo" : (match.awayTeam?.name ?? null)}
            logoUrl={match.awayTeam?.logoUrl}
            sets={match.awaySets}
            isWinner={awayWon}
            isTbd={!isBye && !match.awayTeam}
            isWalkover={isWalkover}
          />
        </div>
      </article>
      {!isLastRound && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 h-px w-3 bg-white/15"
          />
          {!isLone && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute right-0 w-px bg-white/15 ${
                isUpper ? "top-1/2 bottom-0" : "top-0 bottom-1/2"
              }`}
            />
          )}
        </>
      )}
    </div>
  );
}

export default async function CopaPage() {
  const activeSeason = await getActiveSeason().catch(() => null);
  const matches = await prisma.cupMatch.findMany({
    include: { homeTeam: true, awayTeam: true },
    where: activeSeason ? { seasonId: activeSeason.id } : {},
    orderBy: { order: "asc" },
  });
  matches.sort((a, b) => CUP_ROUND_ORDER[a.round] - CUP_ROUND_ORDER[b.round] || a.order - b.order);
  const activeRounds = CUP_ROUNDS.filter((round) => matches.some((match) => match.round === round));
  const firstRoundMatches = activeRounds[0] ? matches.filter((m) => m.round === activeRounds[0]) : [];
  const secondRoundCount = activeRounds[1] ? matches.filter((m) => m.round === activeRounds[1]).length : 0;
  const totalR0Slots = secondRoundCount > 0 ? secondRoundCount * 2 : firstRoundMatches.length;
  const firstRoundByes = Math.max(0, totalR0Slots - firstRoundMatches.length);
  const firstRoundRealIndices = realR0Indices(firstRoundByes, totalR0Slots);
  const finalMatch = matches.find((m) => m.round === "final");
  const finalDecided = finalMatch &&
    (finalMatch.status === "played" || finalMatch.status === "walkover") &&
    finalMatch.homeSets != null && finalMatch.awaySets != null;
  const cupChampion = finalDecided
    ? (finalMatch!.homeSets! > finalMatch!.awaySets! ? finalMatch!.homeTeam : finalMatch!.awayTeam)
    : null;
  const cupRunnerUp = finalDecided
    ? (finalMatch!.homeSets! > finalMatch!.awaySets! ? finalMatch!.awayTeam : finalMatch!.homeTeam)
    : null;
  const finalScore = finalDecided
    ? `${Math.max(finalMatch!.homeSets!, finalMatch!.awaySets!)}–${Math.min(finalMatch!.homeSets!, finalMatch!.awaySets!)}`
    : null;

  const SLOT_HEIGHT = 170;
  const bracketHeight = Math.max(totalR0Slots, 1) * SLOT_HEIGHT;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <h1 className="text-6xl font-black gradient-text">Copa</h1>
      <p className="mt-2 text-slate-400">Eliminatoria directa. Sin segunda oportunidad.</p>

      {cupChampion && (
        <CupChampionBanner
          championLogo={cupChampion.logoUrl}
          championName={cupChampion.name}
          runnerUpLogo={cupRunnerUp?.logoUrl ?? null}
          runnerUpName={cupRunnerUp?.name ?? null}
          score={finalScore ?? ""}
        />
      )}

      {activeRounds.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">La copa todavía no ha comenzado.</p>
      ) : (
        <section className="mt-8 -mx-6 overflow-x-auto px-6 pb-4">
          <div className="flex min-w-max">
            {activeRounds.map((round, roundIdx) => {
              const roundMatches = matches.filter((m) => m.round === round);
              const isLastRound = roundIdx === activeRounds.length - 1;
              const isFirstRound = roundIdx === 0;

              type Entry = { match: CupMatchFull | null; slotIndex: number; flex: number; isLone: boolean };
              const entries: Entry[] = (() => {
                if (isFirstRound) {
                  const realSet = new Set(firstRoundRealIndices);
                  const consumed = new Set<number>();
                  const out: Entry[] = [];
                  for (let i = 0; i < totalR0Slots; i++) {
                    if (consumed.has(i)) continue;
                    const matchIdx = firstRoundRealIndices.indexOf(i);
                    const match = matchIdx >= 0 ? roundMatches[matchIdx] ?? null : null;
                    if (!match) {
                      // Phantom slot. If its pair is real, leave it; otherwise treat as 1-flex empty.
                      // (A real partner will absorb us via the lone branch below — handled when we reach it.)
                      out.push({ match: null, slotIndex: i, flex: 1, isLone: false });
                      continue;
                    }
                    const partnerSlot = i ^ 1;
                    const partnerIsReal = realSet.has(partnerSlot);
                    if (!partnerIsReal && partnerSlot < totalR0Slots) {
                      // Lone match: absorb the phantom partner slot. Skip it later.
                      consumed.add(partnerSlot);
                      // Also remove the empty entry already pushed for the phantom (if pair is above).
                      if (partnerSlot < i) {
                        const idx = out.findIndex((e) => e.slotIndex === partnerSlot && e.match === null);
                        if (idx >= 0) out.splice(idx, 1);
                      }
                      out.push({ match, slotIndex: i, flex: 2, isLone: true });
                    } else {
                      out.push({ match, slotIndex: i, flex: 1, isLone: false });
                    }
                  }
                  return out;
                }
                return roundMatches.map((match, idx) => ({ match, slotIndex: idx, flex: 1, isLone: false }));
              })();

              return (
                <div className="flex w-[300px] shrink-0 flex-col sm:w-[320px]" key={round}>
                  <div className="mb-4 flex items-center gap-3 px-2">
                    <h2 className="text-lg font-black uppercase tracking-wider text-amber-300">
                      {CUP_ROUND_LABELS[round]}
                    </h2>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="flex flex-1 flex-col" style={{ minHeight: bracketHeight }}>
                    {entries.map((entry) => {
                      if (!entry.match) {
                        return (
                          <div
                            aria-hidden="true"
                            className="flex"
                            key={`empty-${round}-${entry.slotIndex}`}
                            style={{ flex: entry.flex }}
                          />
                        );
                      }
                      return (
                        <MatchSlot
                          flexValue={entry.flex}
                          isFirstRound={isFirstRound}
                          isLastRound={isLastRound}
                          isLone={entry.isLone}
                          key={entry.match.id}
                          match={entry.match}
                          slotIndex={entry.slotIndex}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
