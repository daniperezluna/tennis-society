import type { CupRound } from "@/lib/constants";

export function nextPowerOfTwo(value: number) {
  if (value <= 2) return 2;
  return 2 ** Math.ceil(Math.log2(value));
}

function reverseBits(value: number, bits: number): number {
  let result = 0;
  let v = value;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (v & 1);
    v >>= 1;
  }
  return result;
}

// Returns the round-0 slot index for each seed, in seed order (1st, 2nd, ...).
// Uses bit-reversed positions so top seeds land in opposite halves/quarters of the
// bracket and only meet in later rounds.
export function seededByePositions(byes: number, totalR0Slots: number): number[] {
  if (byes <= 0 || totalR0Slots <= 0) return [];
  const bits = Math.max(1, Math.ceil(Math.log2(totalR0Slots)));
  const result: number[] = [];
  for (let i = 0; i < totalR0Slots && result.length < byes; i++) {
    result.push(reverseBits(i, bits));
  }
  return result;
}

// Returns the round-0 indices where real matches sit (sorted ascending).
export function realR0Indices(byes: number, totalR0Slots: number): number[] {
  const byeSet = new Set(seededByePositions(byes, totalR0Slots));
  const real: number[] = [];
  for (let i = 0; i < totalR0Slots; i++) {
    if (!byeSet.has(i)) real.push(i);
  }
  return real;
}

export function roundsForBracket(size: number): CupRound[] {
  if (size >= 64) return ["roundOf64", "roundOf32", "roundOf16", "quarterfinal", "semifinal", "final"];
  if (size >= 32) return ["roundOf32", "roundOf16", "quarterfinal", "semifinal", "final"];
  if (size >= 16) return ["roundOf16", "quarterfinal", "semifinal", "final"];
  if (size >= 8) return ["quarterfinal", "semifinal", "final"];
  if (size >= 4) return ["semifinal", "final"];
  return ["final"];
}

export type BracketMatch = {
  round: CupRound;
  order: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  status: "pending";
  // Link metadata used after createMany to wire nextMatchId via (round, order) lookup.
  nextRound: CupRound | null;
  nextOrder: number | null;
  nextSlot: "home" | "away" | null;
};

export function buildCupBracket<T extends { id: number }>(teams: T[]) {
  const bracketSize = nextPowerOfTwo(teams.length);
  const rounds = roundsForBracket(bracketSize);
  const byes = bracketSize - teams.length;
  const firstRoundMatches = Math.max(1, (teams.length - byes) / 2);
  const byeTeams = teams.slice(0, byes);
  const playingTeams = teams.slice(byes);

  const matches: BracketMatch[] = [];
  const totalR0Slots = bracketSize / 2;
  const realIndices = realR0Indices(byes, totalR0Slots);

  for (let i = 0; i < firstRoundMatches; i++) {
    const slot = realIndices[i] ?? i;
    const nextRound = rounds[1] ?? null;
    matches.push({
      round: rounds[0],
      order: i + 1,
      homeTeamId: playingTeams[i * 2]?.id ?? null,
      awayTeamId: playingTeams[i * 2 + 1]?.id ?? null,
      status: "pending",
      nextRound,
      nextOrder: nextRound ? Math.floor(slot / 2) + 1 : null,
      nextSlot: nextRound ? (slot % 2 === 0 ? "home" : "away") : null,
    });
  }

  let roundSlots = bracketSize / 4;
  for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex];
    const count = Math.max(1, roundSlots);
    const nextRound = rounds[roundIndex + 1] ?? null;

    if (roundIndex === 1) {
      const positions = seededByePositions(byes, count * 2);
      const slots: Array<{ home: number | null; away: number | null }> = [];
      for (let i = 0; i < count; i++) slots.push({ home: null, away: null });
      byeTeams.forEach((team, idx) => {
        if (!team) return;
        const slot = positions[idx];
        if (slot == null) return;
        const matchIdx = Math.floor(slot / 2);
        if (slot % 2 === 0) slots[matchIdx].home = team.id;
        else slots[matchIdx].away = team.id;
      });
      slots.forEach((s, i) => {
        matches.push({
          round,
          order: i + 1,
          homeTeamId: s.home,
          awayTeamId: s.away,
          status: "pending",
          nextRound,
          nextOrder: nextRound ? Math.floor(i / 2) + 1 : null,
          nextSlot: nextRound ? (i % 2 === 0 ? "home" : "away") : null,
        });
      });
    } else {
      for (let i = 0; i < count; i++) {
        matches.push({
          round,
          order: i + 1,
          homeTeamId: null,
          awayTeamId: null,
          status: "pending",
          nextRound,
          nextOrder: nextRound ? Math.floor(i / 2) + 1 : null,
          nextSlot: nextRound ? (i % 2 === 0 ? "home" : "away") : null,
        });
      }
    }
    roundSlots /= 2;
  }

  return { bracketSize, byes, rounds, matches };
}
