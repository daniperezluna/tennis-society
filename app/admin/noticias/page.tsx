import { AdminNav } from "@/components/AdminNav";
import { ConfirmButton } from "@/components/ConfirmButton";
import { NewsForm } from "@/components/admin/NewsForm";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deleteNews } from "../actions";

export const dynamic = "force-dynamic";

export default async function NoticiasAdminPage() {
  await requireAdmin();
  const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AdminNav />
      <h1 className="text-4xl font-black text-ball-500">Noticias</h1>
      <NewsForm hasAi={!!process.env.GOOGLE_GENERATIVE_AI_API_KEY} />
      <div className="mt-6 space-y-2">
        {news.map((item) => (
          <article className="flex items-center justify-between gap-4 rounded-xl bg-card p-4" key={item.id}>
            <p><strong>{item.title}</strong><br/><span className="text-text-muted">{item.summary}</span></p>
            <form action={deleteNews}><input name="id" type="hidden" value={item.id} /><ConfirmButton className="rounded-full border border-red-400/40 px-3 py-1 text-red-200" message="¿Eliminar esta noticia?">Eliminar</ConfirmButton></form>
          </article>
        ))}
      </div>
    </main>
  );
}
