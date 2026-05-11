import { AdminNav } from "@/components/AdminNav";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAdminUser, deleteAdminUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function UsuariosAdminPage() {
  const current = await requireAdmin();
  const users = await prisma.adminUser.findMany({ orderBy: [{ createdAt: "asc" }] });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <AdminNav />
      <h1 className="text-4xl font-black text-ball-500">Usuarios admin</h1>
      <p className="mt-2 text-sm text-text-muted">
        Cualquier usuario aquí puede entrar al panel. Mínimo 8 caracteres en la contraseña.
      </p>

      <form action={createAdminUser} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input className="rounded-lg bg-court-900 px-3 py-2" name="email" placeholder="email" required type="email" />
        <input className="rounded-lg bg-court-900 px-3 py-2" name="name" placeholder="Nombre (opcional)" />
        <input className="rounded-lg bg-court-900 px-3 py-2" minLength={8} name="password" placeholder="Contraseña (mínimo 8)" required type="password" />
        <button className="rounded-lg bg-ball-500 px-4 py-2 font-bold text-court-950" type="submit">Crear</button>
      </form>

      <div className="mt-6 space-y-2">
        {users.map((user) => (
          <article className="flex items-center justify-between gap-4 rounded-xl bg-card p-4" key={user.id}>
            <div>
              <p className="font-bold">{user.name ?? user.email}</p>
              <p className="text-sm text-text-muted">{user.email}</p>
            </div>
            {user.id === current.id ? (
              <span className="rounded-full border border-ball-500/40 bg-ball-500/10 px-3 py-1 text-xs font-bold text-ball-500">
                Tú
              </span>
            ) : (
              <form action={deleteAdminUser}>
                <input name="id" type="hidden" value={user.id} />
                <ConfirmButton
                  className="rounded-full border border-red-400/40 px-3 py-1 text-red-200"
                  message={`¿Eliminar el usuario ${user.email}?`}
                >
                  Eliminar
                </ConfirmButton>
              </form>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
