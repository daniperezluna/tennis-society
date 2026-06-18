import Link from "next/link";
import { getAllSeasons } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const seasons = await getAllSeasons();
  const closedSeasons = seasons.filter((s) => s.status === "closed");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 space-y-8">
      <div>
        <h1 className="text-5xl font-black gradient-text">Historial</h1>
        <p className="mt-2 text-slate-400">Temporadas pasadas de la Apipana Tennis Society.</p>
      </div>

      {closedSeasons.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-slate-400">
          Aún no hay temporadas cerradas. El historial aparecerá aquí cuando termine la primera.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {closedSeasons.map((s) => (
            <Link
              className="glass card-hover rounded-3xl p-6 space-y-2"
              href={`/historial/${s.id}`}
              key={s.id}
            >
              <h2 className="text-2xl font-black text-slate-200">{s.name}</h2>
              <p className="text-sm text-slate-400">
                {s._count.matches} partidos · {s._count.seasonTeams} equipos
              </p>
              {s.closedAt && (
                <p className="text-xs text-slate-600">
                  Finalizada:{" "}
                  {s.closedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
