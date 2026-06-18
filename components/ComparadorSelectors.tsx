"use client";

import { useRouter } from "next/navigation";

type TeamOption = { id: number; name: string; division: number };

export function ComparadorSelectors({
  teams,
  idA,
  idB,
}: {
  teams: TeamOption[];
  idA: number | null;
  idB: number | null;
}) {
  const router = useRouter();

  const navigate = (a: number | null, b: number | null) => {
    const params = new URLSearchParams();
    if (a) params.set("a", String(a));
    if (b) params.set("b", String(b));
    router.push(`/estadisticas/comparador?${params.toString()}`);
  };

  const selectCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white appearance-none focus:outline-none focus:ring-2 focus:ring-apipana-gold/40 cursor-pointer";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-apipana-gold">
          Jugador A
        </label>
        <select
          className={selectCls}
          defaultValue={idA ?? ""}
          onChange={(e) => navigate(Number(e.target.value) || null, idB)}
        >
          <option value="">— Seleccionar —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (Div {t.division})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-apipana-blue">
          Jugador B
        </label>
        <select
          className={selectCls}
          defaultValue={idB ?? ""}
          onChange={(e) => navigate(idA, Number(e.target.value) || null)}
        >
          <option value="">— Seleccionar —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (Div {t.division})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}