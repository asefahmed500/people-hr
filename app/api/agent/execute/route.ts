import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getAgentOrchestrator } from "@/lib/agent/orchestrator";
import { getObservability, type AgentTrace } from "@/lib/agent/observability";
import { rateLimit } from "@/lib/rate-limit";
import { AIUnavailableError } from "@/lib/ai/provider";
import { createApprovals } from "@/lib/agent/approvals";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1).max(10000),
  pageContext: z.string().max(4000).optional(),
  documentContext: z.string().max(16000).optional(),
  maxSteps: z.number().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  // Agent turns call an LLM and may run several tool steps. Key the budget to
  // the signed-in user so a shared office IP doesn't starve everyone, and so
  // changing networks can't reset an individual's limit.
  const limited = rateLimit(request, {
    name: "agent-execute",
    limit: 20,
    windowMs: 60_000,
    subject: auth.session.user.id,
  });
  if (limited) return limited;

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

    // Bind every approval to a server-issued token. The client can only send
    // these ids back; it cannot invent an approval for a different tool/args.
    const pendingApprovals = agentResponse.requiresApproval
      ? await createApprovals(user.userId, agentResponse.pendingApprovals)
      : [];

    return NextResponse.json({
      response: agentResponse.response,
      steps: agentResponse.steps.map((s) => ({
        type: s.type,
        content: s.content,
        durationMs: s.durationMs,
      })),
      toolCalls: agentResponse.toolCalls,
      requiresApproval: agentResponse.requiresApproval,
      pendingApprovals,
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
