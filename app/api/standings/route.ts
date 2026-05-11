import { NextRequest } from "next/server";
import { handleApiError } from "@/lib/api";
import { getStandings } from "@/lib/standings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const division = searchParams.get("division");
    const standings = await getStandings(division ? Number(division) : undefined);
    return Response.json(standings);
  } catch (error) {
    return handleApiError(error);
  }
}
