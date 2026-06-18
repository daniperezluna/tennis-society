import { AdminNav } from "@/components/AdminNav";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createTeam, deleteTeam, updateTeam } from "../actions";

export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-apipana-gold/40";

export default async function EquiposAdminPage() {
  await requireAdmin();
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 space-y-8">
      <AdminNav />
      <div>
        <h1 className="text-4xl font-black gradient-text">Equipos</h1>
        <p className="mt-1 text-slate-400">La división se asigna al crear cada temporada.</p>
      </div>

      {/* Create form */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Nuevo equipo</h2>
        <form action={createTeam} className="grid gap-3 sm:grid-cols-3">
          <input className={inputCls} name="name" placeholder="Nombre" required />
          <input className={inputCls} name="logoUrl" placeholder="URL del escudo (opcional)" />
          <input className={inputCls} name="email" placeholder="Email (opcional)" type="email" />
          <SubmitButton
            className="rounded-xl bg-apipana-gold px-4 py-2.5 text-sm font-black text-black hover:bg-apipana-gold/80 transition-colors sm:col-span-3"
            pendingLabel="Creando…"
          >
            Crear equipo
          </SubmitButton>
        </form>
      </section>

      {/* Team list */}
      <section className="space-y-3">
        {teams.map((team) => (
          <article className="glass rounded-2xl p-4" key={team.id}>
            <form action={updateTeam} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <input name="id" type="hidden" value={team.id} />
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                {team.logoUrl ? (
                  <Image alt={team.name} className="object-cover" fill sizes="48px" src={team.logoUrl} />
                ) : null}
              </div>
              <input
                className={`${inputCls} min-w-0 flex-1`}
                defaultValue={team.name}
                name="name"
                placeholder="Nombre"
                required
              />
              <input
                className={`${inputCls} min-w-0 flex-1`}
                defaultValue={team.logoUrl ?? ""}
                name="logoUrl"
                placeholder="URL del escudo"
              />
              <input
                className={`${inputCls} min-w-0 flex-1`}
                defaultValue={team.email ?? ""}
                name="email"
                placeholder="Email"
                type="email"
              />
              <SubmitButton
                className="shrink-0 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-4 py-2.5 text-sm font-black text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                pendingLabel="…"
              >
                Guardar
              </SubmitButton>
            </form>
            <form action={deleteTeam} className="mt-2 flex justify-end">
              <input name="id" type="hidden" value={team.id} />
              <ConfirmButton
                className="rounded-lg border border-red-400/20 px-3 py-1 text-xs text-red-400 hover:border-red-400/40 hover:text-red-300 transition-colors"
                message={`¿Eliminar "${team.name}"? Si tiene partidos asociados puede fallar.`}
              >
                Eliminar
              </ConfirmButton>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
