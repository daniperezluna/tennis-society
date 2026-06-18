"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type SeasonOption = { id: number; name: string; status: string };

export function SeasonSelector({
  seasons,
  activeSeason,
  current,
}: {
  seasons: SeasonOption[];
  activeSeason: SeasonOption | null;
  current: string; // "active" | "all" | "<id>"
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "active") {
      params.delete("season");
    } else {
      params.set("season", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectCls =
    "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white appearance-none focus:outline-none focus:ring-2 focus:ring-apipana-gold/40 cursor-pointer";

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Temporada</label>
      <select className={selectCls} onChange={(e) => navigate(e.target.value)} value={current}>
        {activeSeason && <option value="active">{activeSeason.name} (actual)</option>}
        <option value="all">Carrera completa</option>
        {seasons
          .filter((s) => s.status === "closed")
          .map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
      </select>
    </div>
  );
}
