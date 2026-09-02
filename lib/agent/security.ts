import type { AIToolCall, AIToolDefinition } from "../ai/types";
import type { UserContext } from "../context/engine";

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export class ToolSecurity {
  checkPermission(
    tool: AIToolDefinition,
    user: UserContext
  ): PermissionCheck {
    if (tool.permission.includes("*")) {
      return { allowed: true };
    }

    if (!tool.permission.includes(user.role)) {
      return {
        allowed: false,
        reason: `Role '${user.role}' does not have permission for tool '${tool.name}'`,
      };
    }

    return { allowed: true };
  }

  validateToolCall(
    toolCall: AIToolCall,
    tools: AIToolDefinition[],
    user: UserContext
  ): { valid: boolean; tool?: AIToolDefinition; error?: string } {
    const tool = tools.find((t) => t.name === toolCall.name);
    if (!tool) {
      return { valid: false, error: `Unknown tool: ${toolCall.name}` };
    }

    const permCheck = this.checkPermission(tool, user);
    if (!permCheck.allowed) {
      return { valid: false, error: permCheck.reason };
    }

    try {
      const args = JSON.parse(toolCall.arguments);
      if (typeof args !== "object" || args === null) {
        return { valid: false, error: "Tool arguments must be an object" };
      }
    } catch {
      return { valid: false, error: "Invalid tool arguments JSON" };
    }

    return { valid: true, tool };
  }

  sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string") {
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim();
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  shouldRequireApproval(tool: AIToolDefinition, args: Record<string, unknown>): boolean {
    if (tool.requiresApproval) return true;
    if (tool.riskLevel === "high") return true;
    if (tool.riskLevel === "medium" && tool.sideEffects) return true;
    return false;
  }
}

let _security: ToolSecurity | null = null;

export function getToolSecurity(): ToolSecurity {
  if (!_security) _security = new ToolSecurity();
  return _security;
}
