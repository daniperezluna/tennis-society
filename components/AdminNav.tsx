import Link from "next/link";
import { logoutAdmin } from "@/lib/auth";

const items = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/equipos", label: "Equipos" },
  { href: "/admin/partidos", label: "Ligas" },
  { href: "/admin/copa", label: "Copa" },
  { href: "/admin/noticias", label: "Noticias" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export function AdminNav() {
  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-slate-950/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Link className="rounded-full px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin}>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Salir</button>
        </form>
      </div>
    </div>
  );
}
