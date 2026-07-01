"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { buildCupBracket, nextPowerOfTwo } from "@/lib/cup";
import { generateDoubleRoundRobin } from "@/lib/league";
import prisma from "@/lib/prisma";
import { getSeededCupTeams } from "@/lib/standings";
import { getActiveSeason, createNewSeason, getSeasonTeams } from "@/lib/season";
import { cupMatchCreateSchema, matchCreateSchema, newsSchema, parseFormData, teamSchema } from "@/lib/validation";

function revalidateCompetition() {
  revalidatePath("/");
  revalidatePath("/liga");
  revalidatePath("/copa");
  revalidatePath("/admin");
}

export async function createTeam(formData: FormData) {
  await requireAdmin();
  await prisma.team.create({ data: teamSchema.parse(parseFormData(formData)) });
  revalidatePath("/admin/equipos");
  revalidateCompetition();
}

export async function updateTeam(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await prisma.team.update({ where: { id }, data: teamSchema.parse(parseFormData(formData)) });
  revalidatePath("/admin/equipos");
  revalidateCompetition();
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  await prisma.team.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/admin/equipos");
  revalidateCompetition();
}

export async function createMatch(formData: FormData) {
  await requireAdmin();
  const season = await getActiveSeason();
  await prisma.match.create({ data: { ...matchCreateSchema.parse(parseFormData(formData)), seasonId: season.id } });
  revalidatePath("/admin/partidos");
  revalidateCompetition();
}

export async function updateMatchResult(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const score = String(formData.get("score") || "");

  const match = await prisma.match.findUniqueOrThrow({ where: { id } });
  const data = (() => {
    const now = new Date();
    if (score === "2-0") return { homeSets: 2, awaySets: 0, status: "played" as const, playedAt: now };
    if (score === "2-1") return { homeSets: 2, awaySets: 1, status: "played" as const, playedAt: now };
    if (score === "1-2") return { homeSets: 1, awaySets: 2, status: "played" as const, playedAt: now };
    if (score === "0-2") return { homeSets: 0, awaySets: 2, status: "played" as const, playedAt: now };
    if (score === "wo-home") return { homeSets: 1, awaySets: 0, status: "walkover" as const, playedAt: now };
    if (score === "wo-away") return { homeSets: 0, awaySets: 1, status: "walkover" as const, playedAt: now };
    return { homeSets: null, awaySets: null, status: "pending" as const, playedAt: null };
  })();

  await prisma.match.update({ where: { id: match.id }, data });
  await evaluateLeaguePredictions(match.id, data.homeSets, data.awaySets, data.status);
  revalidatePath("/admin/partidos");
  revalidatePath("/porra");
  revalidateCompetition();
}

export async function deleteMatch(formData: FormData) {
  await requireAdmin();
  await prisma.match.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/admin/partidos");
  revalidateCompetition();
}

export async function resetLeagues() {
  await requireAdmin();
  const season = await getActiveSeason();
  await prisma.match.deleteMany({ where: { seasonId: season.id } });
  revalidatePath("/admin/partidos");
  revalidateCompetition();
}

export async function generateLeagues() {
  await requireAdmin();
  const season = await getActiveSeason();
  const seasonTeams = await getSeasonTeams(season.id);
  const matches = [1, 2, 3].flatMap((division) =>
    generateDoubleRoundRobin(
      seasonTeams.filter((st) => st.division === division).map((st) => st.team),
      division
    ).map((m) => ({ ...m, seasonId: season.id }))
  );

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { seasonId: season.id } });
    if (matches.length) await tx.match.createMany({ data: matches });
  });

  revalidatePath("/admin/partidos");
  revalidateCompetition();
}

export async function createCupMatch(formData: FormData) {
  await requireAdmin();
  const season = await getActiveSeason();
  await prisma.cupMatch.create({ data: { ...cupMatchCreateSchema.parse(parseFormData(formData)), seasonId: season.id } });
  revalidatePath("/admin/copa");
  revalidateCompetition();
}

function cupWinner(match: { homeTeamId: number | null; awayTeamId: number | null; homeSets: number | null; awaySets: number | null }) {
  if (match.homeSets == null || match.awaySets == null) return null;
  if (match.homeSets > match.awaySets) return match.homeTeamId;
  if (match.awaySets > match.homeSets) return match.awayTeamId;
  return null;
}

async function clearCupAdvance(match: {
  nextMatchId: number | null;
  nextSlot: string | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeSets: number | null;
  awaySets: number | null;
}) {
  const winnerId = cupWinner(match);
  if (!match.nextMatchId || !match.nextSlot || !winnerId) return;

  const next = await prisma.cupMatch.findUnique({ where: { id: match.nextMatchId } });
  if (!next) return;

  await clearCupAdvance(next);
  await prisma.cupMatch.update({
    where: { id: next.id },
    data: {
      homeTeamId: match.nextSlot === "home" && next.homeTeamId === winnerId ? null : undefined,
      awayTeamId: match.nextSlot === "away" && next.awayTeamId === winnerId ? null : undefined,
      homeSets: null,
      awaySets: null,
      status: "pending",
    },
  });
}

export async function updateCupMatchResult(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const score = String(formData.get("score") || "");
  const previous = await prisma.cupMatch.findUniqueOrThrow({ where: { id } });

  const data = (() => {
    const now = new Date();
    if (score === "2-0") return { homeSets: 2, awaySets: 0, status: "played" as const, playedAt: now };
    if (score === "2-1") return { homeSets: 2, awaySets: 1, status: "played" as const, playedAt: now };
    if (score === "1-2") return { homeSets: 1, awaySets: 2, status: "played" as const, playedAt: now };
    if (score === "0-2") return { homeSets: 0, awaySets: 2, status: "played" as const, playedAt: now };
    if (score === "wo-home") return { homeSets: 1, awaySets: 0, status: "walkover" as const, playedAt: now };
    if (score === "wo-away") return { homeSets: 0, awaySets: 1, status: "walkover" as const, playedAt: now };
    return { homeSets: null, awaySets: null, status: "pending" as const, playedAt: null };
  })();

  await clearCupAdvance(previous);
  const updated = await prisma.cupMatch.update({ where: { id }, data });
  const winnerId = cupWinner(updated);

  if (winnerId && updated.nextMatchId && updated.nextSlot) {
    await prisma.cupMatch.update({
      where: { id: updated.nextMatchId },
      data: updated.nextSlot === "home" ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
    });
  }

  await evaluateCupPredictions(id, data.homeSets, data.awaySets, data.status);
  revalidatePath("/admin/copa");
  revalidatePath("/porra");
  revalidateCompetition();
}

export async function updateCupMatchTeams(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const rawHome = formData.get("homeTeamId");
  const rawAway = formData.get("awayTeamId");
  const homeTeamId = rawHome === "" || rawHome == null ? null : Number(rawHome);
  const awayTeamId = rawAway === "" || rawAway == null ? null : Number(rawAway);

  if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
    throw new Error("Los equipos deben ser distintos");
  }

  const previous = await prisma.cupMatch.findUniqueOrThrow({ where: { id } });
  await clearCupAdvance(previous);

  await prisma.cupMatch.update({
    where: { id },
    data: { homeTeamId, awayTeamId, homeSets: null, awaySets: null, status: "pending" },
  });

  revalidatePath("/admin/copa");
  revalidateCompetition();
}

export async function deleteCupMatch(formData: FormData) {
  await requireAdmin();
  const match = await prisma.cupMatch.findUniqueOrThrow({ where: { id: Number(formData.get("id")) } });
  await clearCupAdvance(match);
  await prisma.cupMatch.delete({ where: { id: match.id } });
  revalidatePath("/admin/copa");
  revalidateCompetition();
}

export async function resetCup() {
  await requireAdmin();
  const season = await getActiveSeason();
  await prisma.cupMatch.deleteMany({ where: { seasonId: season.id } });
  revalidatePath("/admin/copa");
  revalidateCompetition();
}

export async function generateCup() {
  await requireAdmin();
  const season = await getActiveSeason();
  const seeded = await getSeededCupTeams(season.id);
  const bracketSize = nextPowerOfTwo(seeded.length);
  const byes = Math.max(0, bracketSize - seeded.length);
  const topSeeds = seeded.slice(0, byes);
  const unseeded = seeded.slice(byes);
  const shuffledUnseeded = unseeded
    .map((team) => ({ team, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ team }) => team);
  const ordered = [...topSeeds, ...shuffledUnseeded];
  const bracket = buildCupBracket(ordered);

  await prisma.$transaction(async (tx) => {
    await tx.cupMatch.deleteMany({ where: { seasonId: season.id } });
    await tx.cupMatch.createMany({
      data: bracket.matches.map(({ round, order, homeTeamId, awayTeamId, status }) => ({
        seasonId: season.id,
        round,
        order,
        homeTeamId,
        awayTeamId,
        status,
      })),
    });

    const created = await tx.cupMatch.findMany();
    const idByKey = new Map<string, number>();
    for (const m of created) idByKey.set(`${m.round}:${m.order}`, m.id);

    for (const m of bracket.matches) {
      if (!m.nextRound || !m.nextOrder) continue;
      const id = idByKey.get(`${m.round}:${m.order}`);
      const nextId = idByKey.get(`${m.nextRound}:${m.nextOrder}`);
      if (!id || !nextId) continue;
      await tx.cupMatch.update({
        where: { id },
        data: { nextMatchId: nextId, nextSlot: m.nextSlot },
      });
    }
  });

  revalidatePath("/admin/copa");
  revalidateCompetition();
}

export async function createNews(formData: FormData) {
  await requireAdmin();
  await prisma.news.create({ data: newsSchema.parse(parseFormData(formData)) });
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  revalidatePath("/");
}

export async function deleteNews(formData: FormData) {
  await requireAdmin();
  await prisma.news.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  revalidatePath("/");
}

export async function createAdminUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim() || null;

  if (!email || !email.includes("@")) throw new Error("Email inválido");
  if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) throw new Error("Ya existe un admin con ese email");

  const role = formData.get("role") === "PLAYER" ? "PLAYER" : "ADMIN";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({ data: { email, passwordHash, name, role } });
  revalidatePath("/admin/usuarios");
}

export async function deleteAdminUser(formData: FormData) {
  const current = await requireAdmin();
  const id = Number(formData.get("id"));
  if (id === current.id) throw new Error("No puedes eliminar tu propio usuario");

  const userToDelete = await prisma.adminUser.findUniqueOrThrow({ where: { id } });
  if (userToDelete.role === "ADMIN") {
    const adminCount = await prisma.adminUser.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) throw new Error("Debe quedar al menos un administrador");
  }

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/usuarios");
}

export async function moveTeamDivision(formData: FormData) {
  await requireAdmin();
  const seasonTeamId = Number(formData.get("seasonTeamId"));
  const newDivision = Number(formData.get("division"));

  if (!seasonTeamId || ![1, 2, 3].includes(newDivision)) throw new Error("Datos inválidos");

  const seasonTeam = await prisma.seasonTeam.findUniqueOrThrow({ where: { id: seasonTeamId } });

  const playedCount = await prisma.match.count({
    where: {
      seasonId: seasonTeam.seasonId,
      status: { not: "pending" },
      OR: [{ homeTeamId: seasonTeam.teamId }, { awayTeamId: seasonTeam.teamId }],
    },
  });
  if (playedCount > 0) throw new Error("Este equipo ya tiene partidos disputados y no puede cambiar de división.");

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({
      where: {
        seasonId: seasonTeam.seasonId,
        OR: [{ homeTeamId: seasonTeam.teamId }, { awayTeamId: seasonTeam.teamId }],
      },
    });
    await tx.seasonTeam.update({ where: { id: seasonTeamId }, data: { division: newDivision } });
    await tx.team.update({ where: { id: seasonTeam.teamId }, data: { division: newDivision } });
  });

  revalidatePath("/admin/temporadas");
  revalidateCompetition();
}

export async function createNewSeasonAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("El nombre de la temporada es obligatorio");
  const closeCurrent = formData.get("closeCurrent") === "on";

  const teamIds = formData.getAll("teamId").map(Number).filter(Boolean);
  const assignments = teamIds.map((teamId) => ({
    teamId,
    division: Number(formData.get(`division_${teamId}`) || 1),
  }));

  await createNewSeason(name, assignments, closeCurrent);
  revalidatePath("/admin/temporadas");
  revalidatePath("/admin");
  revalidateCompetition();
}

export async function updateOwnPassword(formData: FormData) {
  const current = await requireUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
  if (newPassword !== confirmPassword) throw new Error("Las contraseñas no coinciden");

  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: current.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("La contraseña actual es incorrecta");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: current.id }, data: { passwordHash } });

  // Invalida sesiones de otros dispositivos pero mantén la actual.
  const store = await cookies();
  const currentToken = store.get("tennis_admin")?.value;
  await prisma.adminSession.deleteMany({
    where: { userId: current.id, ...(currentToken ? { NOT: { id: currentToken } } : {}) },
  });
  revalidatePath("/admin/usuarios");
}

async function evaluateLeaguePredictions(
  matchId: number,
  homeSets: number | null,
  awaySets: number | null,
  status: string,
) {
  if (status === "played" && homeSets != null && awaySets != null) {
    const preds = await prisma.prediction.findMany({ where: { matchId } });
    await Promise.all(
      preds.map((p) =>
        prisma.prediction.update({
          where: { id: p.id },
          data: { correct: p.homeSets === homeSets && p.awaySets === awaySets },
        }),
      ),
    );
  } else {
    await prisma.prediction.updateMany({ where: { matchId }, data: { correct: null } });
  }
}

async function evaluateCupPredictions(
  cupMatchId: number,
  homeSets: number | null,
  awaySets: number | null,
  status: string,
) {
  if (status === "played" && homeSets != null && awaySets != null) {
    const preds = await prisma.prediction.findMany({ where: { cupMatchId } });
    await Promise.all(
      preds.map((p) =>
        prisma.prediction.update({
          where: { id: p.id },
          data: { correct: p.homeSets === homeSets && p.awaySets === awaySets },
        }),
      ),
    );
  } else {
    await prisma.prediction.updateMany({ where: { cupMatchId }, data: { correct: null } });
  }
}
