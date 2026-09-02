import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getAgentOrchestrator, type AgentRequest } from "@/lib/agent/orchestrator";
import { getObservability } from "@/lib/agent/observability";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1).max(10000),
  pageContext: z.string().optional(),
  documentContext: z.string().optional(),
  maxSteps: z.number().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const u = auth.session.user as { department?: string; managerId?: string };
    const user = {
      userId: auth.session.user.id!,
      name: auth.session.user.name || "User",
      email: auth.session.user.email || "",
      role: (auth.session.user.role as "admin" | "manager" | "employee") || "employee",
      department: (u.department as string) || "",
      managerId: u.managerId as string | undefined,
    };

    const requestId = crypto.randomUUID();
    const obs = getObservability();
    const trace = obs.startTrace(requestId, user.userId, "glm-5.3");

    const orchestrator = getAgentOrchestrator();
    const agentResponse = await orchestrator.execute({
      message: parsed.message,
      user,
      pageContext: parsed.pageContext,
      documentContext: parsed.documentContext,
      maxSteps: parsed.maxSteps,
      requestId,
    });

    obs.completeTrace(
      trace.id,
      agentResponse.requiresApproval ? "completed" : "completed",
      agentResponse.usage
    );

    return NextResponse.json({
      response: agentResponse.response,
      steps: agentResponse.steps.map((s) => ({
        type: s.type,
        content: s.content,
        durationMs: s.durationMs,
      })),
      toolCalls: agentResponse.toolCalls,
      requiresApproval: agentResponse.requiresApproval,
      pendingApprovals: agentResponse.pendingApprovals,
      usage: agentResponse.usage,
      requestId: agentResponse.requestId,
      durationMs: agentResponse.durationMs,
      traceId: trace.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: e.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: `Agent failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
