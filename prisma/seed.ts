import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildCupBracket } from "../lib/cup";
import { generateDoubleRoundRobin } from "../lib/league";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const teams = [
  { name: "Speedy", division: 1, logoUrl: "/team-logos/1-division/001.png", cupEnabled: false },
  { name: "Icarus", division: 1, logoUrl: "/team-logos/1-division/icarus.png", cupEnabled: true },
  { name: "Clockwork", division: 1, logoUrl: "/team-logos/1-division/clockwork.png", cupEnabled: true },
  { name: "Tomares", division: 1, logoUrl: "/team-logos/1-division/tomares.png", cupEnabled: true },
  { name: "Tomate", division: 1, logoUrl: "/team-logos/1-division/tomate.png", cupEnabled: true },
  { name: "Utrilla Sheen", division: 1, logoUrl: "/team-logos/1-division/utrilla.png", cupEnabled: true },
  { name: "La Cabra Extremeña", division: 1, logoUrl: "/team-logos/1-division/goat.png", cupEnabled: true },
  { name: "Gonsales", division: 1, logoUrl: "/team-logos/1-division/gonsales.png", cupEnabled: true },
  { name: "Biker", division: 1, logoUrl: "/team-logos/1-division/biker.png", cupEnabled: true },

  { name: "Machine Gun", division: 2, logoUrl: "/team-logos/2-division/002.png", cupEnabled: false },
  { name: "Real Moon", division: 2, logoUrl: "/team-logos/2-division/realmoon.png", cupEnabled: true },
  { name: "Flo", division: 2, logoUrl: "/team-logos/2-division/flo.png", cupEnabled: true },
  { name: "Richie River", division: 2, logoUrl: "/team-logos/2-division/ruben.png", cupEnabled: true },
  { name: "El Guiri", division: 2, logoUrl: "/team-logos/2-division/guiri.png", cupEnabled: true },
  { name: "Arjonilla", division: 2, logoUrl: "/team-logos/2-division/arjonilla.png", cupEnabled: true },
  { name: "Jesús M", division: 2, logoUrl: "/team-logos/2-division/jesusm.png", cupEnabled: true },
  { name: "Fake Moon", division: 2, logoUrl: "/team-logos/2-division/fakemoon.jpg", cupEnabled: true },
  { name: "The Barrier", division: 2, logoUrl: "/team-logos/2-division/barrero.png", cupEnabled: true },

  { name: "Tercera Fuerza", division: 3, logoUrl: "/team-logos/3-division/003.png", cupEnabled: false },
  { name: "Flora", division: 3, logoUrl: "/team-logos/3-division/flora.png", cupEnabled: true },
  { name: "Lover", division: 3, logoUrl: "/team-logos/3-division/lover.png", cupEnabled: true },
  { name: "Entry Level", division: 3, logoUrl: "/team-logos/3-division/entrylevel.png", cupEnabled: true },
  { name: "María", division: 3, logoUrl: "/team-logos/3-division/maria.png", cupEnabled: true },
  { name: "Hellraiser", division: 3, logoUrl: "/team-logos/3-division/hellraiser.png", cupEnabled: true },
  { name: "Mexican", division: 3, logoUrl: "/team-logos/3-division/mexican.png", cupEnabled: true },
  { name: "Beergas", division: 3, logoUrl: "/team-logos/3-division/beergas.png", cupEnabled: true },
  { name: "Steffi", division: 3, logoUrl: "/team-logos/3-division/steffi.png", cupEnabled: true },
  { name: "Comegambas", division: 3, logoUrl: "/team-logos/3-division/comegambas.jpeg", cupEnabled: true },
];

async function main() {
  await prisma.news.deleteMany();
  await prisma.cupMatch.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();

  const createdTeams = await Promise.all(teams.map((team) => prisma.team.create({ data: team })));
  const leagueMatches = [1, 2, 3].flatMap((division) =>
    generateDoubleRoundRobin(createdTeams.filter((team) => team.division === division), division)
  );
  await prisma.match.createMany({ data: leagueMatches });

  const cupTeams = createdTeams.filter((team) => team.cupEnabled);
  const bracket = buildCupBracket(cupTeams);
  await prisma.cupMatch.createMany({
    data: bracket.matches.map(({ round, order, homeTeamId, awayTeamId, status }) => ({
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
