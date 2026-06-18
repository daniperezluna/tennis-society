import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildCupBracket } from "../lib/cup";
import { generateDoubleRoundRobin } from "../lib/league";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const teams = [
  { name: "Speedy", division: 1, logoUrl: "/team-logos/001.png", cupEnabled: false },
  { name: "Icarus", division: 1, logoUrl: "/team-logos/icarus.png", cupEnabled: true },
  { name: "Clockwork", division: 1, logoUrl: "/team-logos/clockwork.png", cupEnabled: true },
  { name: "Tomares", division: 1, logoUrl: "/team-logos/tomares.png", cupEnabled: true },
  { name: "Tomate", division: 1, logoUrl: "/team-logos/tomate.png", cupEnabled: true },
  { name: "Utrilla Sheen", division: 1, logoUrl: "/team-logos/utrilla.png", cupEnabled: true },
  { name: "La Cabra Extremeña", division: 1, logoUrl: "/team-logos/goat.png", cupEnabled: true },
  { name: "Gonsales", division: 1, logoUrl: "/team-logos/gonsales.png", cupEnabled: true },
  { name: "Biker", division: 1, logoUrl: "/team-logos/biker.png", cupEnabled: true },

  { name: "Machine Gun", division: 2, logoUrl: "/team-logos/002.png", cupEnabled: false },
  { name: "Real Moon", division: 2, logoUrl: "/team-logos/realmoon.png", cupEnabled: true },
  { name: "Flo", division: 2, logoUrl: "/team-logos/flo.png", cupEnabled: true },
  { name: "Richie River", division: 2, logoUrl: "/team-logos/ruben.png", cupEnabled: true },
  { name: "El Guiri", division: 2, logoUrl: "/team-logos/guiri.png", cupEnabled: true },
  { name: "Arjonilla", division: 2, logoUrl: "/team-logos/arjonilla.png", cupEnabled: true },
  { name: "Jesús M", division: 2, logoUrl: "/team-logos/jesusm.png", cupEnabled: true },
  { name: "Fake Moon", division: 2, logoUrl: "/team-logos/fakemoon.jpg", cupEnabled: true },
  { name: "The Barrier", division: 2, logoUrl: "/team-logos/barrero.png", cupEnabled: true },

  { name: "Tercera Fuerza", division: 3, logoUrl: "/team-logos/003.png", cupEnabled: false },
  { name: "Flora", division: 3, logoUrl: "/team-logos/flora.png", cupEnabled: true },
  { name: "Lover", division: 3, logoUrl: "/team-logos/lover.png", cupEnabled: true },
  { name: "Entry Level", division: 3, logoUrl: "/team-logos/entrylevel.png", cupEnabled: true },
  { name: "María", division: 3, logoUrl: "/team-logos/maria.png", cupEnabled: true },
  { name: "Hellraiser", division: 3, logoUrl: "/team-logos/hellraiser.png", cupEnabled: true },
  { name: "Mexican", division: 3, logoUrl: "/team-logos/mexican.png", cupEnabled: true },
  { name: "Beergas", division: 3, logoUrl: "/team-logos/beergas.png", cupEnabled: true },
  { name: "Steffi", division: 3, logoUrl: "/team-logos/steffi.png", cupEnabled: true },
  { name: "Comegambas", division: 3, logoUrl: "/team-logos/comegambas.jpeg", cupEnabled: true },
];

async function main() {
  await prisma.news.deleteMany();
  await prisma.cupMatch.deleteMany();
  await prisma.match.deleteMany();
  await prisma.seasonTeam.deleteMany();
  await prisma.season.deleteMany();
  await prisma.team.deleteMany();

  const createdTeams = await Promise.all(teams.map((team) => prisma.team.create({ data: team })));

  const season = await prisma.season.create({ data: { name: "Temporada 1", status: "active" } });
  await prisma.seasonTeam.createMany({
    data: createdTeams.map((t) => ({ seasonId: season.id, teamId: t.id, division: t.division })),
  });

  const leagueMatches = [1, 2, 3].flatMap((division) =>
    generateDoubleRoundRobin(createdTeams.filter((team) => team.division === division), division)
  );
  await prisma.match.createMany({ data: leagueMatches.map((m) => ({ ...m, seasonId: season.id })) });

  const cupTeams = createdTeams.filter((team) => team.cupEnabled);
  const bracket = buildCupBracket(cupTeams);
  await prisma.cupMatch.createMany({
    data: bracket.matches.map(({ round, order, homeTeamId, awayTeamId, status }) => ({
      seasonId: season.id,
      round,
      order,
      homeTeamId,
      awayTeamId,
      status,
    })),
  });
  const created = await prisma.cupMatch.findMany();
  const idByKey = new Map<string, number>();
  for (const m of created) idByKey.set(`${m.round}:${m.order}`, m.id);
  for (const m of bracket.matches) {
    if (!m.nextRound || !m.nextOrder) continue;
    const id = idByKey.get(`${m.round}:${m.order}`);
    const nextId = idByKey.get(`${m.nextRound}:${m.nextOrder}`);
    if (!id || !nextId) continue;
    await prisma.cupMatch.update({ where: { id }, data: { nextMatchId: nextId, nextSlot: m.nextSlot } });
  }

  await prisma.news.createMany({
    data: [
      {
        title: "Maravilla One More Time!",
        summary: "Juan revalida su título de campeón de liga.",
        content: "El orgullo del Aljarafe vuelve a campeonar en primera división. Speedy lo puso difícil, pero no fue suficiente. ¿Conseguirá su tercer título consecutivo?",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Illa Illa Illa! A primera se va Utrilla!",
        summary: "Utrilla Sheen se ha propuesto llevar el estilo playero a lo más alto.",
        content: "Sangre de tigre y cuerpo de adonis, todo para ser el más grande. Duh, winning?",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Speedy! Speedy! Campeón de Copa",
        summary: "Speedy derrota a la Cabra Extremeña en una final para el recuerdo.",
        content: "Un ejercicio claro de pundonor y lucha llevó a Speedy a su primer título, en una temporada histórica en Apipana.",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("Seed completado con éxito!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
