import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiRequest } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { matchCreateSchema } from "@/lib/validation";
import { MATCH_STATUSES } from "@/lib/constants";
import { getActiveSeason } from "@/lib/season";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const division = searchParams.get("division");
    const status = searchParams.get("status");

    const matches = await prisma.match.findMany({
      where: {
        ...(division ? { division: Number(division) } : {}),
        ...(status && MATCH_STATUSES.includes(status as (typeof MATCH_STATUSES)[number]) ? { status: status as "pending" | "played" } : {}),
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ division: "asc" }, { id: "desc" }],
    });
    return Response.json(matches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await assertAdminApiRequest(req);
  if (unauthorized) return unauthorized;

  try {
    const season = await getActiveSeason();
    const data = matchCreateSchema.parse(await req.json());
    const match = await prisma.match.create({
      data: { ...data, seasonId: season.id },
      include: { homeTeam: true, awayTeam: true },
    });
    return Response.json(match, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
