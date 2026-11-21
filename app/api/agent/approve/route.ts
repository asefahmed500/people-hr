import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { getToolRegistry } from "@/lib/agent/tools";
import { getToolSecurity } from "@/lib/agent/security";
import { z } from "zod";

const approvalSchema = z.object({
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
  approved: z.boolean(),
});

/** Structured refusals returned by unavailable tool executors. */
function refusalError(result: unknown): string | null {
  if (typeof result !== "object" || result === null) return null;
  const obj = result as { ok?: unknown; error?: unknown };
  if (obj.ok === false && typeof obj.error === "string") return obj.error;
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = approvalSchema.parse(body);

    if (!parsed.approved) {
      return NextResponse.json({
        status: "rejected",
        toolName: parsed.toolName,
        message: "Action rejected by user",
      });
    }

    const u = auth.session.user as { department?: string; managerId?: string };
    const user = {
      userId: auth.session.user.id!,
      name: auth.session.user.name || "User",
      email: auth.session.user.email || "",
      role: (auth.session.user.role as "admin" | "manager" | "employee") || "employee",
      department: (u.department as string) || "",
      managerId: u.managerId as string | undefined,
    };

    const registry = getToolRegistry();
    const toolMeta = registry.get(parsed.toolName);
    if (!toolMeta) {
      return NextResponse.json({ error: `Unknown tool: ${parsed.toolName}` }, { status: 400 });
    }

    const security = getToolSecurity();
    const permCheck = security.checkPermission(toolMeta.definition, user);
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.reason }, { status: 403 });
    }

    // This endpoint may only run tools that actually require a human decision.
    // Without this, it doubles as an unauthenticated-by-approval path for any
    // registered tool regardless of its risk level.
    if (!security.shouldRequireApproval(toolMeta.definition)) {
      return NextResponse.json(
        { error: `Tool '${parsed.toolName}' does not require approval.` },
        { status: 403 }
      );
    }

    const sanitized = security.sanitizeArgs(parsed.args);
    const result = await toolMeta.executor(sanitized, user);

    let parsedResult: unknown;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }

    // No pending-approval record is bound to this request (there is no
    // approval store). Report the executor's real outcome instead of a fake
    // success: every write tool currently refuses, so those end in a 422.
    const error = refusalError(parsedResult);
    if (error) {
      return NextResponse.json(
        { status: "unavailable", toolName: parsed.toolName, error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      status: "executed",
      toolName: parsed.toolName,
      result: parsedResult,
    });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Tool execution failed" },
      { status: 500 }
    );
  }
}
