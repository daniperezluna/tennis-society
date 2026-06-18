import prisma from "@/lib/prisma";

type Season = NonNullable<Awaited<ReturnType<typeof prisma.season.findFirst>>>;
type SeasonTeamWithTeam = NonNullable<Awaited<ReturnType<typeof prisma.seasonTeam.findFirst>>> & {
  team: NonNullable<Awaited<ReturnType<typeof prisma.team.findFirst>>>;
};

export async function getActiveSeason(): Promise<Season> {
  const season = await prisma.season.findFirst({ where: { status: "active" } });
  if (!season) throw new Error("No active season found");
  return season;
}

export async function getAllSeasons(): Promise<(Season & { _count: { matches: number; seasonTeams: number } })[]> {
  return prisma.season.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { matches: true, seasonTeams: true } } },
  }) as Promise<(Season & { _count: { matches: number; seasonTeams: number } })[]>;
}

export async function getSeasonTeams(seasonId: number): Promise<SeasonTeamWithTeam[]> {
  return prisma.seasonTeam.findMany({
    where: { seasonId },
    include: { team: true },
    orderBy: [{ division: "asc" }, { team: { name: "asc" } }],
  }) as Promise<SeasonTeamWithTeam[]>;
}

export async function createNewSeason(
  name: string,
  teamAssignments: { teamId: number; division: number }[],
  closeCurrent: boolean
): Promise<Season> {
  return prisma.$transaction(async (tx) => {
    if (closeCurrent) {
      await tx.season.updateMany({
        where: { status: "active" },
        data: { status: "closed", closedAt: new Date() },
      });
    }
    const season = await tx.season.create({ data: { name, status: "active" } });
    if (teamAssignments.length > 0) {
      await tx.seasonTeam.createMany({
        data: teamAssignments.map((a) => ({ seasonId: season.id, teamId: a.teamId, division: a.division })),
      });
    }
    return season;
  });
}
