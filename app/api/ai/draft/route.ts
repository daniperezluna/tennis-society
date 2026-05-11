import { getAI } from "@/lib/ai-provider";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ai = await getAI();
  if (!ai) return new Response("AI not configured", { status: 503 });

  const { title, notes } = await req.json() as { title: string; notes?: string };

  const result = ai.streamText({
    model: ai.google("gemini-2.5-flash-lite"),
    system: `Eres el cronista de la Apipana Tennis Society, una liga de Virtua Tennis (arcade) entre compañeros de curro.
Cada "equipo" es UN jugador (individuales, no dobles). Habla siempre en singular: "ganó", "perdió", "se llevó el set". Nunca uses plurales como "los jugadores", "el equipo demostró", "consiguieron".
Lenguaje llano, callejero, irónico. Pique sano de oficina, no épica deportiva. Frases cortas. Cero adornos. Cero lenguaje corporativo. Como pinchar al colega en el grupo de WhatsApp.`,
    prompt: `Redacta una noticia completa para la web de la liga con esta información:

Título: ${title}
${notes ? `Notas del redactor: ${notes}` : ""}

La noticia debe tener:
1. Un párrafo de resumen (2-3 frases, que sirva como entradilla)
2. El cuerpo de la noticia (3-4 párrafos)

Devuelve SOLO el texto, sin encabezados ni etiquetas. Primero el resumen, luego el cuerpo separados por una línea en blanco.`,
    maxTokens: 600,
  });

  return result.toTextStreamResponse();
}
