-- AlterTable
ALTER TABLE "CupMatch" ADD COLUMN     "playedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "playedAt" TIMESTAMP(3);

-- Backfill: matches ya jugados se marcan con su createdAt como aproximación
UPDATE "Match" SET "playedAt" = "createdAt" WHERE "status" IN ('played', 'walkover');
UPDATE "CupMatch" SET "playedAt" = "createdAt" WHERE "status" IN ('played', 'walkover');
