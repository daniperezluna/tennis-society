import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getStandings } from "@/lib/standings";
import { CUP_ROUND_LABELS, DIVISION_NAMES, DIVISION_COLORS } from "@/lib/constants";
import { getAI } from "@/lib/ai-provider";

const COMMON_RULES = `Eres el cronista de la Apipana Tennis Society, una liga de Virtua Tennis (arcade) entre compañeros de oficina. Estilo: irónico, callejero, pique sano. Como pinchar al colega en el grupo de WhatsApp. Sin épica falsa, sin lirismo, sin adornos vacíos.

DOS COMPETICIONES DISTINTAS:
- LIGA: round-robin con tres divisiones llamadas Hierba, Arcilla y Dura. Todos juegan contra todos ida y vuelta.
- COPA: eliminatoria directa con rondas (Octavos, Cuartos, Semifinales, Final). Si pierdes, te vas.
- Cada partido del contexto viene marcado con [LIGA división X] o [COPA ronda Y].

REGLAS DE CONTENIDO:
- Hierba, Arcilla, Dura, Octavos, Cuartos, Semifinales, Final son NOMBRES DE DIVISIONES O RONDAS, no son jugadores.
- Los jugadores son los nombres concretos del contexto: Biker, Tomate, Icarus, Flo, Speedy, etc.
- Cada partido es individual, al mejor de 3 sets.
- Foco en lo MÁS RECIENTE: el partido #1 del contexto es el último jugado.
- No inventes resultados, nombres ni rondas.`;

const generateSlogan = unstable_cache(
  async (context: string): Promise<string> => {
    const ai = await getAI();
    if (!ai) throw new Error("AI not configured");
    const { text } = await ai.generateText({
      model: ai.google("gemini-2.5-flash-lite"),
      system: `${COMMON_RULES}

TAREA: generar el H1 grande de la home. Es el GANCHO visual, lo primero que se lee, así que tiene que llamar la atención y referirse a lo MÁS RECIENTE (resultado #1 del contexto). NUNCA generes algo genérico, siempre sobre el último evento.

FORMATO ESTRICTO:
- Dos frases muy cortas, de 2-5 palabras cada una, separadas por un punto.
- Total máximo: 9 palabras.
- Una frase nombra protagonista o acción concreta, la otra remata con guasa.
- Sin comillas envolviendo el texto. Sin emojis.

EJEMPLOS DE TONO Y ESTRUCTURA (NO copies literal, son solo guías de estilo):
- "Biker arrasa. Tomate al suelo."
- "Flo despierta. Real Moon llora."
- "Speedy fuera. Sorpresón en cuartos."
- "Tomate da guerra. Pero cae."
- "Otra de Biker. Como siempre."`,
      prompt: `Contexto actual:\n\n${context}\n\nDevuelve SOLO el slogan, sin nada más.`,
      temperature: 1,
      maxOutputTokens: 40,
    });
    return text.trim().replace(/^["']|["']$/g, "");
  },
  ["ai-slogan"],
  { revalidate: 60 * 60 * 24 },
);

const generateHeadline = unstable_cache(
  async (context: string): Promise<string> => {
    const ai = await getAI();
    if (!ai) throw new Error("AI not configured");
    const { text } = await ai.generateText({
      model: ai.google("gemini-2.5-flash-lite"),
      system: `${COMMON_RULES}

TAREA: generar un TITULAR estilo prensa deportiva amateur, para el subtítulo de la home. Formato estricto:
- Una sola frase de 10-18 palabras, con punto al final.
- Cuenta lo más jugoso del último resultado (la derrota en copa, la victoria sorprendente, una racha, etc.).
- Sin emojis, sin hashtags, sin comillas envolviendo el texto.

EJEMPLOS DE TONO (no copies literal):
- "Biker pasa por encima de Icarus con un 2-0 y sigue como un cohete en Hierba."
- "Tomate le saca un set a Clockwork pero acaba cayendo en la prórroga."
- "Flo elimina a Real Moon en cuartos tras un tie-break para enmarcar."
- "Speedy se va de copa por la puerta de atrás: sorpresón en cuartos."`,
      prompt: `Contexto actual:\n\n${context}\n\nDevuelve SOLO el titular, sin nada más.`,
      temperature: 1,
      maxOutputTokens: 80,
    });
    return text.trim().replace(/^["']|["']$/g, "");
  },
  ["ai-headline"],
  { revalidate: 60 * 60 * 24 },
);

export const dynamic = "force-dynamic";

function formatNewsDate(date: Date) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date);
}

function TeamLogo({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
      {src ? <Image alt={name} className="object-cover" fill src={src} sizes="48px" /> : null}
    </div>
  );
}

function IconUsers() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default async function Home() {
  const [division1, division2, division3, news, teamsCount, cupCount, playedMatches, pendingMatches, recentLeague, recentCup] = await Promise.all([
    getStandings(1),
    getStandings(2),
    getStandings(3),
    prisma.news.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.team.count(),
    prisma.team.count({ where: { cupEnabled: true } }),
    prisma.match.count({ where: { status: "played" } }),
    prisma.match.count({ where: { status: "pending" } }),
    prisma.match.findMany({
      where: { status: { in: ["played", "walkover"] }, playedAt: { not: null } },
      orderBy: { playedAt: "desc" },
      take: 5,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    }),
    prisma.cupMatch.findMany({
      where: { status: { in: ["played", "walkover"] }, playedAt: { not: null } },
      orderBy: { playedAt: "desc" },
      take: 5,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    }),
  ]);
  const leaders = [division1[0], division2[0], division3[0]].filter(Boolean);

  let sloganMessage: string | null = null;
  let headlineMessage: string | null = null;
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    type RecentEvent = {
      kind: "liga" | "copa";
      label: string;
      winner: string;
      loser: string;
      score: string;
      playedAt: Date;
    };

    const formatScore = (homeSets: number | null, awaySets: number | null, status: string) =>
      status === "walkover"
        ? "walkover"
        : `${Math.max(homeSets ?? 0, awaySets ?? 0)}-${Math.min(homeSets ?? 0, awaySets ?? 0)}`;

    const events: RecentEvent[] = [
      ...recentLeague.map((m): RecentEvent => {
        const homeWon = (m.homeSets ?? 0) > (m.awaySets ?? 0);
        return {
          kind: "liga",
          label: `LIGA división ${DIVISION_NAMES[m.division]}`,
          winner: homeWon ? m.homeTeam.name : m.awayTeam.name,
          loser: homeWon ? m.awayTeam.name : m.homeTeam.name,
          score: formatScore(m.homeSets, m.awaySets, m.status),
          playedAt: m.playedAt!,
        };
      }),
      ...recentCup.map((m): RecentEvent => {
        const homeWon = (m.homeSets ?? 0) > (m.awaySets ?? 0);
        const winnerName = homeWon ? m.homeTeam?.name : m.awayTeam?.name;
        const loserName = homeWon ? m.awayTeam?.name : m.homeTeam?.name;
        return {
          kind: "copa",
          label: `COPA ${CUP_ROUND_LABELS[m.round]}`,
          winner: winnerName ?? "?",
          loser: loserName ?? "?",
          score: formatScore(m.homeSets, m.awaySets, m.status),
          playedAt: m.playedAt!,
        };
      }),
    ]
      .filter((e) => e.winner !== "?" && e.loser !== "?")
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, 5);

    const recentLines = events.map(
      (e) =>
        `[${e.label}] ${e.winner} ganó a ${e.loser} (${e.score})${e.kind === "copa" ? " · eliminatoria directa" : ""}`,
    );

    const contextLines = [
      recentLines.length
        ? `ÚLTIMOS RESULTADOS (de más reciente a más antiguo, mezcla de liga y copa):\n${recentLines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`
        : "Todavía no se ha jugado ningún partido.",
      leaders.length
        ? `LÍDERES DE LIGA: ${leaders.map((r, i) => `División ${DIVISION_NAMES[i + 1]}: ${r.team.name} (${r.points} pts)`).join(" · ")}`
        : "",
      `Total: ${playedMatches} partidos de liga jugados, ${pendingMatches} pendientes.`,
    ].filter(Boolean);

    const context = contextLines.join("\n\n");
    const [slogan, headline] = await Promise.allSettled([
      generateSlogan(context),
      generateHeadline(context),
    ]);
    if (slogan.status === "fulfilled") sloganMessage = slogan.value;
    else console.error("[ai slogan]", slogan.reason);
    if (headline.status === "fulfilled") headlineMessage = headline.value;
    else console.error("[ai headline]", headline.reason);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#1a1230]/80 p-8 shadow-2xl shadow-[#110c1d]/50 md:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-apipana-gold/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-apipana-blue/18 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-apipana-gold/30 bg-apipana-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[.25em] text-apipana-gold">
              Apipana Tennis Society
            </p>
            <div className="court-line mt-5 mb-5 max-w-xs" />
            <h1 className="max-w-4xl text-5xl font-black sm:text-7xl lg:text-8xl">
              {(sloganMessage ?? "Vuestra pista. Vuestro pique.")
                .split(/(?<=\.)\s+/)
                .map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
            </h1>
            {headlineMessage ? (
              <p className="mt-6 flex max-w-xl items-start gap-2 text-lg font-semibold leading-snug text-slate-200">
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-apipana-gold" aria-hidden="true" />
                {headlineMessage}
              </p>
            ) : (
              <p className="mt-6 max-w-xl text-lg text-slate-300">
                Sigue la liga, el cuadro de copa y las crónicas de la Apipana Tennis Society. Todo en un sitio.
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-apipana-gold px-6 py-3 text-sm font-black text-[#110c1d] shadow-lg shadow-apipana-gold/20 transition hover:brightness-110"
                href="/liga"
              >
                Ver liga
              </Link>
              <Link
                className="rounded-full bg-apipana-blue px-6 py-3 text-sm font-black text-white shadow-lg shadow-apipana-blue/20 transition hover:brightness-110"
                href="/copa"
              >
                Ver copa
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[.25em] text-apipana-gold">Ahora mandan</p>
            <div className="mt-4 grid gap-3">
              {leaders.map((row, index) => (
                <Link
                  className="card-hover flex items-center gap-4 rounded-2xl border border-white/10 bg-[#110c1d]/45 p-4"
                  href="/liga"
                  key={row.team.id}
                >
                  <div className={`flex h-10 shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-black ${DIVISION_COLORS[index + 1].badgeBg} ${DIVISION_COLORS[index + 1].badgeText}`}>
                    {DIVISION_NAMES[index + 1]}
                  </div>
                  <TeamLogo name={row.team.name} src={row.team.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-black">{row.team.name}</h3>
                    <p className="text-sm text-slate-400">{row.points} pts</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-apipana-gold/60">Liga →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Link className="glass card-hover flex flex-col gap-3 rounded-3xl p-6" href="/liga">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-apipana-gold/12 text-apipana-gold">
            <IconUsers />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Equipos</p>
            <p className="mt-1 text-5xl font-black text-apipana-gold">{teamsCount}</p>
          </div>
        </Link>
        <Link className="glass card-hover flex flex-col gap-3 rounded-3xl p-6" href="/copa">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-apipana-blue/20 text-court-400">
            <IconTrophy />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">En copa</p>
            <p className="mt-1 text-5xl font-black text-apipana-blue">{cupCount}</p>
          </div>
        </Link>
        <Link className="glass card-hover flex flex-col gap-3 rounded-3xl p-6" href="/liga">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <IconCheckCircle />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Jugados</p>
            <p className="mt-1 text-5xl font-black text-emerald-300">{playedMatches}</p>
          </div>
        </Link>
        <Link className="glass card-hover flex flex-col gap-3 rounded-3xl p-6" href="/liga">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
            <IconClock />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pendientes</p>
            <p className="mt-1 text-5xl font-black text-amber-300">{pendingMatches}</p>
          </div>
        </Link>
      </section>

      {/* Bottom section */}
      <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <div className="glass rounded-3xl p-6">
          <h2 className="text-3xl font-black text-apipana-gold">Explora</h2>
          <div className="mt-5 grid gap-3">
            {[
              { href: "/liga", label: "Clasificaciones y jornadas", desc: "Posiciones y calendario" },
              { href: "/copa", label: "Cuadro de copa", desc: "Eliminatoria directa" },
              { href: "/noticias", label: "Crónicas y avisos", desc: "Noticias de la liga" },
            ].map((item) => (
              <Link
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:border-apipana-gold/22 hover:bg-white/8"
                href={item.href}
                key={item.href}
              >
                <div>
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <span className="text-slate-600 transition-colors group-hover:text-apipana-gold">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-apipana-gold">Últimas noticias</h2>
            <Link className="text-sm font-semibold text-slate-400 transition-colors hover:text-apipana-gold" href="/noticias">
              Ver todas →
            </Link>
          </div>
          {news.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">Pronto habrá crónicas aquí.</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {news.map((item) => (
                <article
                  className="card-hover flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5"
                  key={item.id}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {formatNewsDate(item.createdAt)}
                  </p>
                  <h3 className="mt-2 text-lg font-black leading-snug">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">{item.summary}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
