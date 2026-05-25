import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiRequest } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { teamSchema } from "@/lib/validation";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({ orderBy: [{ division: "asc" }, { name: "asc" }], omit: { email: true } });
    return Response.json(teams);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await assertAdminApiRequest(req);
  if (unauthorized) return unauthorized;

  try {
    const data = teamSchema.parse(await req.json());
    const team = await prisma.team.create({ data });
    return Response.json(team, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
