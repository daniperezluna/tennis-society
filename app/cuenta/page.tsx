import { PasswordChangeForm } from "@/components/admin/PasswordChangeForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-4xl font-black text-ball-500">Mi cuenta</h1>
      <p className="mt-2 text-sm text-text-muted">{user.name ?? user.email}</p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl font-black text-ball-500">Cambiar contraseña</h2>
        <p className="mt-1 text-xs text-text-muted">
          Al cambiarla se cerrará la sesión en otros dispositivos.
        </p>
        <PasswordChangeForm />
      </section>
    </main>
  );
}
