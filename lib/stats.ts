import prisma from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";

type Team = NonNullable<Awaited<ReturnType<typeof prisma.team.findFirst>>>;

export type MatchEntry = {
  matchId: number;
  opponentId: number;
  opponentName: string;
  result: "W" | "L";
  tight: boolean;
  ownSets: number;
  rivalSets: number;
  matchday: number | null;
  playedAt: Date | null;
  division: number;
};

export type PlayerStats = {
  team: Team;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  winRatio: number;
  wins20: number;
  wins21: number;
  losses02: number;
  losses12: number;
  currentStreak: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  scheduleStrength: number;
  matchHistory: MatchEntry[];
};

export type HeatmapData = {
  teams: Team[];
  matrix: number[][];
};

export type ProgressionSeries = {
  teamId: number;
  name: string;
  logoUrl: string | null;
  points: number[];
};

export type ContestedMatch = {
  id: number;
  division: number;
  matchday: number | null;
  homeName: string;
  awayName: string;
  homeSets: number;
  awaySets: number;
  playedAt: Date | null;
};

function computeStreaks(history: Pick<MatchEntry, "result">[]) {
  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  let cur = 0;
  let curSign = 0;

  for (const entry of history) {
    const sign = entry.result === "W" ? 1 : -1;
    if (curSign === 0 || sign === curSign) {
      cur++;
      curSign = sign;
    } else {
      cur = 1;
      curSign = sign;
    }
    if (sign === 1) maxWinStreak = Math.max(maxWinStreak, cur);
    else maxLoseStreak = Math.max(maxLoseStreak, cur);
  }

  let currentStreak = 0;
  if (history.length > 0) {
    const lastSign = history[history.length - 1].result === "W" ? 1 : -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if ((history[i].result === "W" ? 1 : -1) !== lastSign) break;
      currentStreak++;
    }
    currentStreak *= lastSign;
  }

  return { currentStreak, maxWinStreak, maxLoseStreak };
}

// seasonId = undefined → active season; seasonId = 0 → all seasons (career)
export async function getAllPlayersStats(seasonId?: number): Promise<PlayerStats[]> {
  const sid = seasonId === 0 ? undefined : (seasonId ?? (await getActiveSeason()).id);

  const [teams, matches] = await Promise.all([
    sid
      ? prisma.seasonTeam.findMany({ where: { seasonId: sid }, include: { team: true }, orderBy: { team: { name: "asc" } } }).then((rows) => rows.map((r) => r.team))
      : prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
      where: { status: { in: ["played", "walkover"] }, ...(sid ? { seasonId: sid } : {}) },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: [{ playedAt: "asc" }, { id: "asc" }],
    }),
  ]);

  const statsMap = new Map<number, PlayerStats>();

  for (const team of teams) {
    const myMatches = matches.filter(
      (m) =>
        (m.homeTeamId === team.id || m.awayTeamId === team.id) &&
        m.homeSets != null &&
        m.awaySets != null
    );

    let played = 0, won = 0, lost = 0, setsWon = 0, setsLost = 0;
    let wins20 = 0, wins21 = 0, losses02 = 0, losses12 = 0;
    const matchHistory: MatchEntry[] = [];

    for (const m of myMatches) {
      const isHome = m.homeTeamId === team.id;
      const ownSets = isHome ? m.homeSets! : m.awaySets!;
      const rivalSets = isHome ? m.awaySets! : m.homeSets!;
      const opponentId = isHome ? m.awayTeamId : m.homeTeamId;
      const opponentName = isHome ? m.awayTeam.name : m.homeTeam.name;
      const didWin = ownSets > rivalSets;
      const tight = Math.min(ownSets, rivalSets) === 1;

      matchHistory.push({
        matchId: m.id,
        opponentId,
        opponentName,
        result: didWin ? "W" : "L",
        tight,
        ownSets,
        rivalSets,
        matchday: m.matchday,
        playedAt: m.playedAt,
        division: m.division,
      });

      if (m.status === "walkover") {
        if (didWin) won++;
        continue;
      }

      played++;
      setsWon += ownSets;
      setsLost += rivalSets;

      if (didWin) {
        won++;
        tight ? wins21++ : wins20++;
      } else {
        lost++;
        tight ? losses12++ : losses02++;
      }
    }

    const { currentStreak, maxWinStreak, maxLoseStreak } = computeStreaks(matchHistory);

    statsMap.set(team.id, {
      team,
      played,
      won,
      lost,
      setsWon,
      setsLost,
      setsDiff: setsWon - setsLost,
      winRatio: played > 0 ? won / played : 0,
      wins20,
      wins21,
      losses02,
      losses12,
      currentStreak,
      maxWinStreak,
      maxLoseStreak,
      scheduleStrength: 0,
      matchHistory,
    });
  }

  // Division-scoped ranks for SoS
  const byDivision = new Map<number, PlayerStats[]>();
  for (const s of statsMap.values()) {
    if (!byDivision.has(s.team.division)) byDivision.set(s.team.division, []);
    byDivision.get(s.team.division)!.push(s);
  }

  const divisionRankMap = new Map<number, number>();
  for (const divStats of byDivision.values()) {
    divStats
      .sort((a, b) =>
        b.won !== a.won ? b.won - a.won :
        b.setsDiff !== a.setsDiff ? b.setsDiff - a.setsDiff :
        a.team.name.localeCompare(b.team.name)
      )
      .forEach((s, i) => divisionRankMap.set(s.team.id, i + 1));
  }

  for (const s of statsMap.values()) {
    const ranks = s.matchHistory
      .map((m) => divisionRankMap.get(m.opponentId))
      .filter((r): r is number => r !== undefined);
    s.scheduleStrength =
      ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0;
  }

  return [...statsMap.values()].sort((a, b) =>
    b.won !== a.won ? b.won - a.won : b.setsDiff - a.setsDiff
  );
}

export async function getDivisionHeatmap(division: number, seasonId?: number): Promise<HeatmapData> {
  const sid = seasonId === 0 ? undefined : (seasonId ?? (await getActiveSeason()).id);

  const [teams, matches] = await Promise.all([
    sid
      ? prisma.seasonTeam.findMany({ where: { seasonId: sid, division }, include: { team: true }, orderBy: { team: { name: "asc" } } }).then((rows) => rows.map((r) => r.team))
      : prisma.team.findMany({ where: { division }, orderBy: { name: "asc" } }),
    prisma.match.findMany({
      where: { division, status: { in: ["played", "walkover"] }, ...(sid ? { seasonId: sid } : {}) },
    }),
  ]);

  const n = teams.length;
  const indexMap = new Map(teams.map((t, i) => [t.id, i]));
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const m of matches) {
    if (m.homeSets == null || m.awaySets == null) continue;
    const winnerId = m.homeSets > m.awaySets ? m.homeTeamId : m.awayTeamId;
    const loserId = m.homeSets > m.awaySets ? m.awayTeamId : m.homeTeamId;
    const wi = indexMap.get(winnerId);
    const li = indexMap.get(loserId);
    if (wi !== undefined && li !== undefined) matrix[wi][li]++;
  }

  return { teams, matrix };
}

export async function getMatchdayProgression(division: number, seasonId?: number): Promise<ProgressionSeries[]> {
  const sid = seasonId === 0 ? undefined : (seasonId ?? (await getActiveSeason()).id);

  const [teams, matches] = await Promise.all([
    sid
      ? prisma.seasonTeam.findMany({ where: { seasonId: sid, division }, include: { team: true }, orderBy: { team: { name: "asc" } } }).then((rows) => rows.map((r) => r.team))
      : prisma.team.findMany({ where: { division }, orderBy: { name: "asc" } }),
    prisma.match.findMany({
      where: { division, status: { in: ["played", "walkover"] }, matchday: { not: null }, ...(sid ? { seasonId: sid } : {}) },
      orderBy: [{ matchday: "asc" }, { id: "asc" }],
    }),
  ]);

  const maxMatchday = matches.reduce((acc, m) => Math.max(acc, m.matchday ?? 0), 0);

  return teams.map((team) => {
    if (maxMatchday === 0) {
      return { teamId: team.id, name: team.name, logoUrl: team.logoUrl, points: [] };
    }

    const myMatches = matches.filter(
      (m) =>
        (m.homeTeamId === team.id || m.awayTeamId === team.id) &&
        m.homeSets != null &&
        m.awaySets != null
    );

    let cum = 0;
    const points = Array.from({ length: maxMatchday }, (_, dayIdx) => {
      const day = dayIdx + 1;
      for (const m of myMatches.filter((m) => m.matchday === day)) {
        const isHome = m.homeTeamId === team.id;
        const own = isHome ? m.homeSets! : m.awaySets!;
        const rival = isHome ? m.awaySets! : m.homeSets!;
        if (own > rival) cum++;
      }
      return cum;
    });

    return { teamId: team.id, name: team.name, logoUrl: team.logoUrl, points };
  });
}

export async function getContestedMatches(limit = 15, seasonId?: number): Promise<ContestedMatch[]> {
  const sid = seasonId === 0 ? undefined : (seasonId ?? (await getActiveSeason()).id);

  const matches = await prisma.match.findMany({
    where: { status: "played", ...(sid ? { seasonId: sid } : {}) },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: [{ playedAt: "desc" }, { id: "desc" }],
  });

  return matches
    .filter((m) => m.homeSets != null && m.awaySets != null && m.homeSets + m.awaySets === 3)
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      division: m.division,
      matchday: m.matchday,
      homeName: m.homeTeam.name,
      awayName: m.awayTeam.name,
      homeSets: m.homeSets!,
      awaySets: m.awaySets!,
      playedAt: m.playedAt,
    }));
}