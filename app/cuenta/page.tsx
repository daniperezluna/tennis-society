import { PasswordChangeForm } from "@/components/admin/PasswordChangeForm";
import { TeamLogo } from "@/components/TeamLogo";
import { requireUser } from "@/lib/auth";
import { CUP_ROUND_LABELS, DIVISION_COLORS, DIVISION_NAMES } from "@/lib/constants";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const user = await requireUser();

  const dbUser = await prisma.adminUser.findUniqueOrThrow({
    where: { id: user.id },
    include: { team: true },
  });

  const team = dbUser.team;
  let division: number | null = null;
  let pendingMatches: Awaited<ReturnType<typeof fetchPendingMatches>> = [];
  let pendingCupMatches: Awaited<ReturnType<typeof fetchPendingCupMatches>> = [];

  if (team) {
    const activeSeason = await prisma.season.findFirst({ where: { status: "active" } });
    if (activeSeason) {
      const [seasonTeam, matches, cupMatches] = await Promise.all([
        prisma.seasonTeam.findUnique({
          where: { seasonId_teamId: { seasonId: activeSeason.id, teamId: team.id } },
        }),
        fetchPendingMatches(team.id, activeSeason.id),
        fetchPendingCupMatches(team.id, activeSeason.id),
      ]);
      division = seasonTeam?.division ?? team.division;
      pendingMatches = matches;
      pendingCupMatches = cupMatches;
    }
  }

  const divColors = division ? DIVISION_COLORS[division] : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      {team ? (
        <div className="flex items-center gap-4">
          <TeamLogo name={team.name} src={team.logoUrl} variant="standings" />
          <div>
            <h1 className="text-3xl font-black">{team.name}</h1>
            {division && divColors && (
              <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${divColors.badgeBg} ${divColors.badgeText}`}>
                {DIVISION_NAMES[division]}
              </span>
            )}
          </div>
        </div>
      ) : (
        <h1 className="text-3xl font-black text-ball-500">{user.name ?? user.email}</h1>
      )}

      {team && (
        <>
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black text-ball-500">Liga — partidos pendientes</h2>
            {pendingMatches.length === 0 ? (
              <p className="text-sm text-text-muted">No hay partidos pendientes.</p>
            ) : (
              <ul className="space-y-2">
                {pendingMatches.map((match) => {
                  const isHome = match.homeTeamId === team.id;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  return (
                    <li key={match.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                      <TeamLogo name={opponent.name} src={opponent.logoUrl} variant="schedule" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{isHome ? "vs" : "en"} {opponent.name}</p>
                        {match.matchday && (
                          <p className="text-xs text-text-muted">Jornada {match.matchday}</p>
                        )}
                      </div>
                      {match.date && (
                        <time className="shrink-0 text-xs text-text-muted" dateTime={match.date.toISOString()}>
                          {match.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </time>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black text-ball-500">Copa — partidos pendientes</h2>
            {pendingCupMatches.length === 0 ? (
              <p className="text-sm text-text-muted">No hay partidos de copa pendientes.</p>
            ) : (
              <ul className="space-y-2">
                {pendingCupMatches.map((match) => {
                  const isHome = match.homeTeamId === team.id;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  return (
                    <li key={match.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                      {opponent ? (
                        <TeamLogo name={opponent.name} src={opponent.logoUrl} variant="schedule" />
                      ) : (
                        <span className="h-7 w-7 shrink-0 rounded-xl bg-white/10 ring-1 ring-white/10" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {opponent ? `${isHome ? "vs" : "en"} ${opponent.name}` : "Rival por determinar"}
                        </p>
                        <p className="text-xs text-text-muted">{CUP_ROUND_LABELS[match.round]}</p>
                      </div>
                      {match.date && (
                        <time className="shrink-0 text-xs text-text-muted" dateTime={match.date.toISOString()}>
                          {match.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </time>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="mt-10 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-black text-ball-500">Cambiar contraseña</h2>
        <p className="mt-1 text-xs text-text-muted">
          Al cambiarla se cerrará la sesión en otros dispositivos.
        </p>
        <PasswordChangeForm />
      </section>
    </main>
  );
}

function fetchPendingMatches(teamId: number, seasonId: number) {
  return prisma.match.findMany({
    where: {
      seasonId,
      status: "pending",
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    select: {
      id: true,
      homeTeamId: true,
      matchday: true,
      date: true,
      homeTeam: { select: { name: true, logoUrl: true } },
      awayTeam: { select: { name: true, logoUrl: true } },
    },
    orderBy: [{ matchday: "asc" }, { id: "asc" }],
  });
}

function fetchPendingCupMatches(teamId: number, seasonId: number) {
  return prisma.cupMatch.findMany({
    where: {
      seasonId,
      status: "pending",
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    select: {
      id: true,
      homeTeamId: true,
      round: true,
      date: true,
      homeTeam: { select: { name: true, logoUrl: true } },
      awayTeam: { select: { name: true, logoUrl: true } },
    },
    orderBy: [{ order: "asc" }],
  });
}
