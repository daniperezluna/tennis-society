-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('active', 'closed');

-- CreateTable Season
CREATE TABLE "Season" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "status"    "SeasonStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt"  TIMESTAMP(3)
);

-- CreateTable SeasonTeam
CREATE TABLE "SeasonTeam" (
  "id"       SERIAL PRIMARY KEY,
  "seasonId" INTEGER NOT NULL,
  "teamId"   INTEGER NOT NULL,
  "division" INTEGER NOT NULL,
  CONSTRAINT "SeasonTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE,
  CONSTRAINT "SeasonTeam_teamId_fkey"   FOREIGN KEY ("teamId")   REFERENCES "Team"("id")   ON DELETE CASCADE
);

-- UniqueIndex on SeasonTeam
CREATE UNIQUE INDEX "SeasonTeam_seasonId_teamId_key" ON "SeasonTeam"("seasonId", "teamId");

-- Seed: Temporada 1 — ACTIVE (current league is still in progress)
INSERT INTO "Season" ("name", "status", "createdAt")
VALUES ('Temporada 1', 'active', NOW());

-- Seed SeasonTeam: assign all current teams at their current division
INSERT INTO "SeasonTeam" ("seasonId", "teamId", "division")
SELECT (SELECT "id" FROM "Season" WHERE "name" = 'Temporada 1'), "id", "division"
FROM "Team";

-- Add seasonId (nullable first for backfill)
ALTER TABLE "Match"    ADD COLUMN "seasonId" INTEGER;
ALTER TABLE "CupMatch" ADD COLUMN "seasonId" INTEGER;

-- Backfill: all existing matches belong to Temporada 1
UPDATE "Match"    SET "seasonId" = (SELECT "id" FROM "Season" WHERE "name" = 'Temporada 1');
UPDATE "CupMatch" SET "seasonId" = (SELECT "id" FROM "Season" WHERE "name" = 'Temporada 1');

-- Make non-nullable and add FK
ALTER TABLE "Match"    ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "CupMatch" ALTER COLUMN "seasonId" SET NOT NULL;

ALTER TABLE "Match"    ADD CONSTRAINT "Match_seasonId_fkey"    FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CupMatch" ADD CONSTRAINT "CupMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
