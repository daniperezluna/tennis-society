import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getActiveSeason } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [activeSeason, teams, news] = await Promise.all([
    getActiveSeason().catch(() => null),
    prisma.team.count(),
    prisma.news.count(),
  ]);
  const sid = activeSeason?.id;
  const [matches, cupMatches] = await Promise.all([
    prisma.match.count({ where: sid ? { seasonId: sid } : {} }),
    prisma.cupMatch.count({ where: sid ? { seasonId: sid } : {} }),
  ]);

  const sections = [
    ["Temporadas", "/admin/temporadas", null, "text-apipana-gold"],
    ["Equipos", "/admin/equipos", teams, "text-ball-500"],
    ["Partidos", "/admin/partidos", matches, "text-ball-500"],
    ["Copa", "/admin/copa", cupMatches, "text-ball-500"],
    ["Noticias", "/admin/noticias", news, "text-ball-500"],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AdminNav />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-5xl font-black gradient-text">Panel admin</h1>
        {activeSeason && (
          <span className="rounded-full border border-apipana-gold/30 bg-apipana-gold/10 px-3 py-1 text-xs font-bold text-apipana-gold">
            {activeSeason.name}
          </span>
        )}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {sections.map(([label, href, count, colorCls]) => (
          <Link className="card-hover rounded-2xl border border-border bg-card p-5" href={href} key={href}>
            <p className="text-sm text-text-muted">Gestionar</p>
            <h2 className={`mt-1 text-2xl font-bold ${colorCls}`}>{label}</h2>
            {count != null && <p className="mt-3 text-4xl font-black">{count}</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}
