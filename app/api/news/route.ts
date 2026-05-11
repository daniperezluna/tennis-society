import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiRequest } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { newsSchema } from "@/lib/validation";

export async function GET() {
  try {
    const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(news);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await assertAdminApiRequest(req);
  if (unauthorized) return unauthorized;

  try {
    const data = newsSchema.parse(await req.json());
    const item = await prisma.news.create({ data });
    return Response.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
