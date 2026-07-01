import { loginAdmin } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-10">
      <form action={loginAdmin} className="w-full rounded-2xl border border-border bg-card p-6">
        <h1 className="text-3xl font-black text-ball-500">Acceso admin</h1>
        <p className="mt-2 text-sm text-text-muted">Inicia sesión con tu correo y contraseña.</p>
        {params.error === "no-admin" ? (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">
            No tienes permisos de administrador.
          </p>
        ) : params.error && (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">
            Credenciales incorrectas.
          </p>
        )}
        <label className="mt-5 block text-sm font-semibold" htmlFor="email">Email</label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-border bg-court-900 px-3 py-2"
          id="email"
          name="email"
          required
          type="email"
        />
        <label className="mt-4 block text-sm font-semibold" htmlFor="password">Contraseña</label>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-border bg-court-900 px-3 py-2"
          id="password"
          name="password"
          required
          type="password"
        />
        <button className="mt-5 w-full rounded-full bg-ball-500 px-4 py-3 font-bold text-court-950" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
