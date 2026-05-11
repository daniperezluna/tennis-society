type TeamForSchedule = { id: number; division: number };

type GeneratedMatch = {
  division: number;
  homeTeamId: number;
  awayTeamId: number;
  matchday: number;
  status: "pending";
};

export function generateDoubleRoundRobin(teams: TeamForSchedule[], division: number): GeneratedMatch[] {
  const participants: Array<TeamForSchedule | null> = [...teams];
  if (participants.length % 2 === 1) participants.push(null);

  const n = participants.length;
  if (n < 2) return [];

  const rounds = n - 1;
  const half = n / 2;
  const rotation = [...participants];
  const firstLeg: GeneratedMatch[] = [];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      if (!a || !b) continue;

      const swap = (round + i) % 2 === 1;
      firstLeg.push({
        division,
        homeTeamId: swap ? b.id : a.id,
        awayTeamId: swap ? a.id : b.id,
        matchday: round + 1,
        status: "pending",
      });
    }

    rotation.splice(1, 0, rotation.pop()!);
  }

  const secondLeg = firstLeg.map((match) => ({
    ...match,
    homeTeamId: match.awayTeamId,
    awayTeamId: match.homeTeamId,
    matchday: match.matchday + rounds,
  }));

  return [...firstLeg, ...secondLeg];
}
