"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function upsertPrediction(formData: FormData) {
  const user = await requireUser();
  const score = String(formData.get("score") || "");
  const matchId = formData.get("matchId") ? Number(formData.get("matchId")) : null;
  const cupMatchId = formData.get("cupMatchId") ? Number(formData.get("cupMatchId")) : null;

  const parts = score.split("-").map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) throw new Error("Resultado inválido");
  const [homeSets, awaySets] = parts;

  if (matchId) {
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId } },
      create: { userId: user.id, matchId, homeSets, awaySets },
      update: { homeSets, awaySets, correct: null },
    });
  } else if (cupMatchId) {
    await prisma.prediction.upsert({
      where: { userId_cupMatchId: { userId: user.id, cupMatchId } },
      create: { userId: user.id, cupMatchId, homeSets, awaySets },
      update: { homeSets, awaySets, correct: null },
    });
  }

  revalidatePath("/porra");
}
