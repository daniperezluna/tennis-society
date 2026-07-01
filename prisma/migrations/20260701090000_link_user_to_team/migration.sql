-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "teamId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_teamId_key" ON "AdminUser"("teamId");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: link existing PLAYER users to their team by matching email
UPDATE "AdminUser" u
SET "teamId" = t.id
FROM "Team" t
WHERE u.email = t.email AND u.role = 'PLAYER';
