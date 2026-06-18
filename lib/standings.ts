import prisma from "@/lib/prisma";

// Returns cup-eligible teams ordered as seeds: D1.1, D2.1, D3.1, D1.2, D2.2, D3.2, ...
// Top seeds (= number of byes) get the protected bracket positions; the rest play R0.
export async function getSeededCupTeams() {
  const standings = await Promise.all([1, 2, 3].map((d) => getStandings(d)));
  const eligible = standings.map((rows) => rows.filter((r) => r.team.cupEnabled));
  const maxLen = Math.max(...eligible.map((rows) => rows.length));
  const seeded: typeof eligible[number][number]["team"][] = [];
  for (let pos = 0; pos < maxLen; pos++) {
    for (const rows of eligible) {
      if (rows[pos]) seeded.push(rows[pos].team);
    }
  }
  return seeded;
}

export async function getStandings(division?: number) {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ where: division ? { division } : {}, orderBy: { name: "asc" } }),
    prisma.match.findMany({
      where: { status: { in: ["played", "walkover"] }, ...(division ? { division } : {}) },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: [{ playedAt: "desc" }, { id: "desc" }],
    }),
  ]);

  const standings = teams.map((team) => {
    const relevant = matches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id);
    let played = 0;
    let won = 0;
    let lost = 0;
    let setsWon = 0;
    let setsLost = 0;

    for (const match of relevant) {
      if (match.homeSets == null || match.awaySets == null) continue;
      const isHome = match.homeTeamId === team.id;
      const ownScore = isHome ? match.homeSets : match.awaySets;
      const rivalScore = isHome ? match.awaySets : match.homeSets;
      const teamWon = ownScore > rivalScore;
      if (match.status === "walkover") {
        if (teamWon) won++;
        continue;
      }
      played++;
      setsWon += ownScore;
      setsLost += rivalScore;
      if (teamWon) won++;
      else lost++;
    }

    const formMatches = matches
      .filter((m) => (m.homeTeamId === team.id || m.awayTeamId === team.id) && m.homeSets != null && m.awaySets != null)
      .slice(0, 3);

    const form = formMatches.map((m) => {
      const isHome = m.homeTeamId === team.id;
      const ownScore = isHome ? m.homeSets! : m.awaySets!;
      const rivalScore = isHome ? m.awaySets! : m.homeSets!;
      return {
        result: (ownScore > rivalScore ? "W" : "L") as "W" | "L",
        tight: Math.min(ownScore, rivalScore) === 1,
        opponentName: isHome ? m.awayTeam.name : m.homeTeam.name,
      };
    });

    return { team, played, won, lost, setsWon, setsLost, setsDiff: setsWon - setsLost, points: won, form };
  });

  // Build head-to-head map: how many wins team A has against team B (in played matches).
  const h2h = new Map<string, number>();
  for (const match of matches) {
    if (match.homeSets == null || match.awaySets == null) continue;
    const winnerId = match.homeSets > match.awaySets ? match.homeTeamId : match.awayTeamId;
    const loserId = match.homeSets > match.awaySets ? match.awayTeamId : match.homeTeamId;
    const key = `${winnerId}>${loserId}`;
    h2h.set(key, (h2h.get(key) ?? 0) + 1);
  }
  function h2hAdvantage(aId: number, bId: number) {
    const aWins = h2h.get(`${aId}>${bId}`) ?? 0;
    const bWins = h2h.get(`${bId}>${aId}`) ?? 0;
    return bWins - aWins; // positive => a is ranked lower (b had more wins)
  }

  standings.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;
    const head = h2hAdvantage(a.team.id, b.team.id);
    if (head !== 0) return head;
    return a.team.name.localeCompare(b.team.name);
  });

  return standings;
}
