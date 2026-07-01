-- CreateTable
CREATE TABLE "Prediction" (
  "id"         SERIAL PRIMARY KEY,
  "userId"     INTEGER NOT NULL,
  "matchId"    INTEGER,
  "cupMatchId" INTEGER,
  "homeSets"   INTEGER NOT NULL,
  "awaySets"   INTEGER NOT NULL,
  "correct"    BOOLEAN,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Prediction_userId_fkey"     FOREIGN KEY ("userId")     REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Prediction_matchId_fkey"    FOREIGN KEY ("matchId")    REFERENCES "Match"("id")     ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Prediction_cupMatchId_fkey" FOREIGN KEY ("cupMatchId") REFERENCES "CupMatch"("id")  ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_matchId_key"    ON "Prediction"("userId", "matchId");
CREATE UNIQUE INDEX "Prediction_userId_cupMatchId_key" ON "Prediction"("userId", "cupMatchId");
