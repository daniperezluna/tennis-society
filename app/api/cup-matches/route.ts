import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiRequest } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { cupMatchCreateSchema } from "@/lib/validation";
import { CUP_ROUND_ORDER } from "@/lib/constants";

export async function GET() {
  try {
    const matches = await prisma.cupMatch.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ order: "asc" }],
    });
    matches.sort((a, b) => CUP_ROUND_ORDER[a.round] - CUP_ROUND_ORDER[b.round] || a.order - b.order);
    return Response.json(matches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await assertAdminApiRequest(req);
  if (unauthorized) return unauthorized;

  try {
    const data = cupMatchCreateSchema.parse(await req.json());
    const match = await prisma.cupMatch.create({
      data,
      include: { homeTeam: true, awayTeam: true },
    });
    return Response.json(match, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
