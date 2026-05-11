import { Prisma } from "@/app/generated/prisma/client";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Datos inválidos", 422, error.flatten());
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return jsonError("Recurso no encontrado", 404);
    if (error.code === "P2003") return jsonError("Relación inválida o recurso en uso", 409);
  }

  console.error(error);
  return jsonError("Error interno del servidor", 500);
}
