import { AdminNav } from "@/components/AdminNav";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createTeam, deleteTeam, updateTeam } from "../actions";

export const dynamic = "force-dynamic";

export default async function EquiposAdminPage() {
  await requireAdmin();
  const teams = await prisma.team.findMany({ orderBy: [{ division: "asc" }, { name: "asc" }] });
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <AdminNav />
      <h1 className="text-4xl font-black text-amber-300">Equipos</h1>
      <p className="mt-2 text-slate-300">Edita nombre completo, logo, división y si entra o no en sorteo de Copa.</p>

      <form action={createTeam} className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-5 md:grid-cols-5">
        <input className="rounded-xl bg-black/30 px-3 py-2 md:col-span-2" name="name" placeholder="Nombre completo" required />
        <input className="rounded-xl bg-black/30 px-3 py-2" name="division" placeholder="División" type="number" min="1" max="3" required />
        <input className="rounded-xl bg-black/30 px-3 py-2" name="logoUrl" placeholder="Logo URL" />
        <label className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 text-sm"><input name="cupEnabled" type="checkbox" defaultChecked /> Copa</label>
        <SubmitButton className="rounded-xl bg-amber-300 px-3 py-2 font-black text-slate-950 md:col-span-5">Crear equipo</SubmitButton>
      </form>

      <div className="mt-6 grid gap-4">
        {teams.map((team) => (
          <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-xl" key={team.id}>
            <form action={updateTeam} className="grid gap-3 md:grid-cols-[70px_1.8fr_110px_1.5fr_100px_auto] md:items-center">
              <input name="id" type="hidden" value={team.id} />
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/10">
                {team.logoUrl ? <Image alt={team.name} className="object-cover" fill src={team.logoUrl} sizes="64px" /> : null}
              </div>
              <input className="rounded-xl bg-white/10 px-3 py-2 font-bold" name="name" defaultValue={team.name} />
              <input className="rounded-xl bg-white/10 px-3 py-2" name="division" type="number" min="1" max="3" defaultValue={team.division} />
              <input className="rounded-xl bg-white/10 px-3 py-2" name="logoUrl" defaultValue={team.logoUrl ?? ""} />
              <label className="flex items-center gap-2 text-sm"><input name="cupEnabled" type="checkbox" defaultChecked={team.cupEnabled} /> Copa</label>
              <SubmitButton className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950">Guardar</SubmitButton>
            </form>
            <form action={deleteTeam} className="mt-3 flex justify-end">
              <input name="id" type="hidden" value={team.id} />
              <ConfirmButton className="rounded-full border border-red-300/40 px-3 py-1 text-sm text-red-200" message="¿Eliminar este equipo? Si tiene partidos asociados puede fallar por seguridad.">Eliminar</ConfirmButton>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
