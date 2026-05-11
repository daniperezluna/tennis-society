import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const teams = await prisma.team.findMany();
  let updated = 0;
  for (const t of teams) {
    if (!t.logoUrl) continue;
    const newUrl = t.logoUrl.replace(/\/team-logos\/(?:1-division|2-division|3-division|4-copa)\//, "/team-logos/");
    if (newUrl !== t.logoUrl) {
      await prisma.team.update({ where: { id: t.id }, data: { logoUrl: newUrl } });
      updated++;
    }
  }
  console.log(`Updated ${updated} teams`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
