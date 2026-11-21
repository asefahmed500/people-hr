import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getAgentOrchestrator } from "@/lib/agent/orchestrator";
import { getObservability, type AgentTrace } from "@/lib/agent/observability";
import { rateLimit } from "@/lib/rate-limit";
import { AIUnavailableError } from "@/lib/ai/provider";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1).max(10000),
  pageContext: z.string().optional(),
  documentContext: z.string().optional(),
  maxSteps: z.number().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  // Agent turns call an LLM and may run several tool steps, so bound the
  // request rate before doing any auth/work. Best-effort, per-process.
  const limited = rateLimit(request, { name: "agent-execute", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const requestId = crypto.randomUUID();
  const obs = getObservability();
  let trace: AgentTrace | undefined;

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

    trace = obs.startTrace(requestId, user.userId, "glm-5.3");

    const orchestrator = getAgentOrchestrator();
    const agentResponse = await orchestrator.execute({
      message: parsed.message,
      user,
      pageContext: parsed.pageContext,
      documentContext: parsed.documentContext,
      maxSteps: parsed.maxSteps,
      requestId,
    });

    // Approval-required turns are a distinct terminal state — recording them
    // as "completed" hid that no user decision had been made yet.
    obs.completeTrace(
      trace.id,
      agentResponse.requiresApproval ? "awaiting_approval" : "completed",
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
    if (trace) {
      obs.completeTrace(
        trace.id,
        "failed",
        undefined,
        e instanceof Error ? e.message : "Unknown error"
      );
    }
    if (e instanceof z.ZodError || e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (e instanceof AIUnavailableError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Agent processing failed" },
      { status: 500 }
    );
  }
}
