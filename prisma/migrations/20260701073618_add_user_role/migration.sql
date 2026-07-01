-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PLAYER');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';
