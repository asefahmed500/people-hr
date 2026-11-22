import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getRetriever } from "@/lib/rag/retriever";
import { EmbeddingUnavailableError } from "@/lib/rag/embeddings";
import { AIUnavailableError } from "@/lib/ai/provider";
import { getAIService } from "@/lib/ai/service";
import { getContextEngine } from "@/lib/context/engine";
import { rateLimit } from "@/lib/rate-limit";
import { recordActivity } from "@/lib/activity";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1).max(5000),
  topK: z.number().min(1).max(20).optional(),
  documentIds: z.array(z.string()).optional(),
});

function isEmbeddingUnavailable(e: unknown): e is EmbeddingUnavailableError {
  return (
    e instanceof EmbeddingUnavailableError ||
    (typeof e === "object" && e !== null && (e as { code?: string }).code === "EMBEDDING_UNAVAILABLE")
  );
}

export async function POST(request: NextRequest) {
  // Uploads are admin-only, so the corpus can contain confidential HR letters.
  // Search must be admin-only too; a plain requireAuth() here was a direct
  // exfiltration path for any signed-in employee with LLM access configured.
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const limited = rateLimit(request, {
    name: "documents-search",
    limit: 60,
    windowMs: 60_000,
    subject: auth.session.user.id,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const retriever = getRetriever();
    const results = await retriever.retrieve(parsed.message, {
      topK: parsed.topK || 5,
      documentIds: parsed.documentIds,
    });

    const ragContext = retriever.buildContext(results);

    const contextEngine = getContextEngine();
    const context = await contextEngine.buildContext(
      {
        userId: auth.session.user.id!,
        name: auth.session.user.name || "User",
        email: auth.session.user.email || "",
        role: (auth.session.user.role as "admin" | "manager" | "employee") || "employee",
        department: ((auth.session.user as { department?: string }).department) || "",
      },
      undefined,
      undefined,
      ragContext.contextText
    );

    const messages = contextEngine.buildMessages(context, parsed.message);

    const ai = getAIService();
    const response = await ai.generate(messages, {
      userId: auth.session.user.id,
      tier: "reasoning",
    });

    // Record metadata only — never the query or retrieved text.
    await recordActivity({
      actor: {
        id: auth.session.user.id!,
        name: auth.session.user.name ?? null,
        department: (auth.session.user as { department?: string | null }).department ?? null,
        role: auth.session.user.role,
      },
      action: "system",
      module: "documents",
      summary: `Searched the HR document corpus (${results.totalChunks} chunk(s))`,
    });

    return NextResponse.json({
      response: response.content,
      sources: ragContext.sources,
      chunksFound: results.totalChunks,
      processingTimeMs: results.processingTimeMs,
      usage: response.usage,
    });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (isEmbeddingUnavailable(e) || e instanceof AIUnavailableError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error("Document search failed:", e);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
