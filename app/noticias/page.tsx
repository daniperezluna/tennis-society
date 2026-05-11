import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateParts(date: Date) {
  const day = new Intl.DateTimeFormat("es", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("es", { month: "short" }).format(date);
  const year = new Intl.DateTimeFormat("es", { year: "numeric" }).format(date);
  return { day, month: month.replace(".", "").toUpperCase(), year };
}

export default async function NoticiasPage() {
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-5xl font-black gradient-text">Noticias</h1>
      <p className="mt-3 text-slate-400">Actualidad, crónicas y avisos de la liga.</p>
      <div className="court-divider mt-8" />

      {news.length === 0 ? (
        <p className="mt-10 text-slate-500">Sin noticias por ahora.</p>
      ) : (
        <section className="mt-8 space-y-0">
          {news.map((item, index) => {
            const { day, month, year } = formatDateParts(item.createdAt);
            const isLast = index === news.length - 1;
            return (
              <article className="group flex gap-6" key={item.id}>
                {/* Date column */}
                <div className="flex w-14 shrink-0 flex-col items-center pt-1 text-center">
                  <span className="text-3xl font-black leading-none text-apipana-gold">{day}</span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{month}</span>
                  <span className="text-[10px] text-slate-700">{year}</span>
                  {!isLast && <div className="mt-4 w-px flex-1 bg-white/8" style={{ minHeight: "2rem" }} />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-10">
                  <div className="rounded-2xl border border-white/8 bg-card p-6 transition-colors group-hover:border-white/15">
                    <h2 className="text-2xl font-black leading-snug text-ball-500">{item.title}</h2>
                    <p className="mt-3 text-base leading-relaxed text-court-100">{item.summary}</p>
                    {item.content && (
                      <>
                        <div className="court-line my-4" />
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">{item.content}</p>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
