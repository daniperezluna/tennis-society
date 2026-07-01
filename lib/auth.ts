import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

const COOKIE_NAME = "tennis_admin";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

export type AdminUser = { id: number; email: string; name: string | null; role: "ADMIN" | "PLAYER" };

function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { id: token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { id: token } }).catch(() => {});
    return null;
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role };
}

export async function isAdminSession(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/login");
  return user;
}

export async function requireUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/login");
  return user;
}

export async function loginUser(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=1");

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) redirect("/login?error=1");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) redirect("/login?error=1");

  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.adminSession.create({ data: { id: sessionId, userId: user.id, expiresAt } });

  const store = await cookies();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function logoutAdmin() {
  "use server";
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.adminSession.delete({ where: { id: token } }).catch(() => {});
  }
  store.delete(COOKIE_NAME);
  redirect("/login");
}

export async function assertAdminApiRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return Response.json({ error: "No autorizado" }, { status: 401 });

  const session = await prisma.adminSession.findUnique({ where: { id: token } });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}
