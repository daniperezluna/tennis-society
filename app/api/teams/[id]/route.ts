import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiRequest } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { teamSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const unauthorized = await assertAdminApiRequest(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const data = teamSchema.parse(await req.json());
    const team = await prisma.team.update({ where: { id: Number(id) }, data });
    return Response.json(team);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const unauthorized = await assertAdminApiRequest(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await prisma.team.delete({ where: { id: Number(id) } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
