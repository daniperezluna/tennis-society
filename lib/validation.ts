import { z } from "zod";
import { CUP_ROUNDS, MATCH_STATUSES } from "@/lib/constants";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || value.startsWith("/") || z.url().safeParse(value).success, "Debe ser una URL válida o una ruta local")
  .transform((value) => (value ? value : null));

const nullableInt = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => (value === "" || value == null ? null : Number(value)))
  .pipe(z.number().int().nonnegative().nullable());

const optionalDate = z
  .union([z.string(), z.date(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null || value === "") return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  })
  .pipe(z.date().nullable());

const differentTeams = <T extends { homeTeamId?: number | null; awayTeamId?: number | null }>(data: T) =>
  !data.homeTeamId || !data.awayTeamId || data.homeTeamId !== data.awayTeamId;

export const teamSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  logoUrl: optionalUrl,
  division: z.coerce.number().int().min(1).max(3),
  cupEnabled: z
    .union([z.boolean(), z.string(), z.null(), z.undefined()])
    .transform((value) => value === true || value === "true" || value === "on" || value === "si"),
});

const matchBaseSchema = z.object({
  division: z.coerce.number().int().min(1).max(3),
  homeTeamId: z.coerce.number().int().positive(),
  awayTeamId: z.coerce.number().int().positive(),
  homeSets: nullableInt,
  awaySets: nullableInt,
  setDetails: z.string().trim().optional().nullable().transform((v) => v || null),
  matchday: nullableInt,
  date: optionalDate,
  status: z.enum(MATCH_STATUSES).default("pending"),
});

export const matchCreateSchema = matchBaseSchema.refine(differentTeams, {
  message: "Los equipos deben ser distintos",
  path: ["awayTeamId"],
});

export const matchUpdateSchema = matchBaseSchema.partial().refine(differentTeams, {
  message: "Los equipos deben ser distintos",
  path: ["awayTeamId"],
});

const cupMatchBaseSchema = z.object({
  round: z.enum(CUP_ROUNDS),
  order: z.coerce.number().int().nonnegative().default(0),
  homeTeamId: nullableInt,
  awayTeamId: nullableInt,
  homeSets: nullableInt,
  awaySets: nullableInt,
  setDetails: z.string().trim().optional().nullable().transform((v) => v || null),
  date: optionalDate,
  status: z.enum(MATCH_STATUSES).default("pending"),
});

export const cupMatchCreateSchema = cupMatchBaseSchema.refine(differentTeams, {
  message: "Los equipos deben ser distintos",
  path: ["awayTeamId"],
});

export const cupMatchUpdateSchema = cupMatchBaseSchema.partial().refine(differentTeams, {
  message: "Los equipos deben ser distintos",
  path: ["awayTeamId"],
});

export const newsSchema = z.object({
  title: z.string().trim().min(3),
  summary: z.string().trim().min(10),
  content: z.string().trim().min(20),
  imageUrl: optionalUrl,
});

export function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
