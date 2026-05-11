"use client";

import { useRef, useState } from "react";
import { createNews } from "@/app/admin/actions";

export function NewsForm({ hasAi }: { hasAi: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [notes, setNotes] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDraft() {
    const title = titleRef.current?.value.trim();
    if (!title) {
      setError("Escribe un título antes de generar el borrador.");
      return;
    }

    setError(null);
    setDrafting(true);
    if (summaryRef.current) summaryRef.current.value = "";
    if (contentRef.current) contentRef.current.value = "";

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, notes }),
      });

      if (!res.ok) throw new Error("Error al contactar con la IA.");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Sin stream.");

      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        full += decoder.decode(value, { stream: true });

        const [firstPara, ...rest] = full.split(/\n\n+/);
        if (summaryRef.current) summaryRef.current.value = firstPara ?? "";
        if (contentRef.current) contentRef.current.value = rest.join("\n\n");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={createNews}
      className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5"
    >
      <input
        ref={titleRef}
        className="rounded-lg bg-court-900 px-3 py-2"
        name="title"
        placeholder="Título"
        required
      />

      {/* AI drafting assistant */}
      <div className={`rounded-xl border p-4 ${hasAi ? "border-apipana-gold/20 bg-apipana-gold/5" : "border-white/8 bg-white/3"}`}>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-apipana-gold">
          Asistente IA
        </p>
        {hasAi ? (
          <>
            <textarea
              className="w-full rounded-lg bg-court-900 px-3 py-2 text-sm"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para la IA: qué pasó, quién ganó, algún detalle..."
              rows={2}
              value={notes}
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            <button
              className="mt-2 flex items-center gap-2 rounded-lg bg-apipana-gold px-4 py-2 text-sm font-bold text-[#110c1d] disabled:opacity-50"
              disabled={drafting}
              onClick={generateDraft}
              type="button"
            >
              {drafting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#110c1d]/30 border-t-[#110c1d]" />
                  Generando...
                </>
              ) : (
                "Generar borrador"
              )}
            </button>
          </>
        ) : (
          <p className="text-xs text-slate-500">
            Añade <code className="rounded bg-white/8 px-1">GOOGLE_GENERATIVE_AI_API_KEY</code> en <code className="rounded bg-white/8 px-1">.env</code> para activar la generación de borradores.
          </p>
        )}
      </div>

      <textarea
        ref={summaryRef}
        className="rounded-lg bg-court-900 px-3 py-2"
        name="summary"
        placeholder="Resumen"
        required
        rows={2}
      />
      <textarea
        ref={contentRef}
        className="min-h-40 rounded-lg bg-court-900 px-3 py-2"
        name="content"
        placeholder="Contenido"
        required
        rows={6}
      />
      <input
        className="rounded-lg bg-court-900 px-3 py-2"
        name="imageUrl"
        placeholder="Imagen URL (opcional)"
      />
      <button className="rounded-lg bg-ball-500 px-3 py-2 font-bold text-court-950" type="submit">
        Publicar
      </button>
    </form>
  );
}
