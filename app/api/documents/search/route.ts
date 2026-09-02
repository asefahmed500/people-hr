import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getRetriever } from "@/lib/rag/retriever";
import { getAIService } from "@/lib/ai/service";
import { getContextEngine } from "@/lib/context/engine";
import { getVectorStore } from "@/lib/rag/vector-store";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1).max(5000),
  topK: z.number().min(1).max(20).optional(),
  documentIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

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

    return NextResponse.json({
      response: response.content,
      sources: ragContext.sources,
      chunksFound: results.totalChunks,
      processingTimeMs: results.processingTimeMs,
      usage: response.usage,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: e.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
