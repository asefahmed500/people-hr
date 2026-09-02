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

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = approvalSchema.parse(body);

    if (!parsed.approved) {
      return NextResponse.json({
        status: "rejected",
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

    const sanitized = security.sanitizeArgs(parsed.args);
    const result = await toolMeta.executor(sanitized, user.userId, user.role);

    return NextResponse.json({
      status: "executed",
      toolName: parsed.toolName,
      result: JSON.parse(result),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: e.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Tool execution failed" },
      { status: 500 }
    );
  }
}
