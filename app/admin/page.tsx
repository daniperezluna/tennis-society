import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [teams, matches, cupMatches, news] = await Promise.all([
    prisma.team.count(), prisma.match.count(), prisma.cupMatch.count(), prisma.news.count(),
  ]);
  const sections = [
    ["Equipos", "/admin/equipos", teams],
    ["Partidos", "/admin/partidos", matches],
    ["Copa", "/admin/copa", cupMatches],
    ["Noticias", "/admin/noticias", news],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AdminNav />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-5xl font-black gradient-text">Panel admin</h1>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {sections.map(([label, href, count]) => (
          <Link className="card-hover rounded-2xl border border-border bg-card p-5" href={href} key={href}>
            <p className="text-sm text-text-muted">Gestionar</p>
            <h2 className="mt-1 text-2xl font-bold text-ball-500">{label}</h2>
            <p className="mt-3 text-4xl font-black">{count}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
