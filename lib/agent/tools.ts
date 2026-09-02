import { z } from "zod";
import type { AIToolDefinition } from "../ai/types";

export type ToolRiskLevel = "low" | "medium" | "high";

export interface ToolMetadata {
  definition: AIToolDefinition;
  executor: (args: Record<string, unknown>, userId: string, role: string) => Promise<string>;
  category: string;
}

class ToolRegistry {
  private tools: Map<string, ToolMetadata> = new Map();

  register(tool: ToolMetadata): void {
    this.tools.set(tool.definition.name, tool);
  }

  get(name: string): ToolMetadata | undefined {
    return this.tools.get(name);
  }

  getDefinitions(): AIToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  getDefinitionsForRole(role: string): AIToolDefinition[] {
    return this.getDefinitions().filter((t) => {
      if (t.permission.includes("*")) return true;
      return t.permission.includes(role);
    });
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  listCategories(): string[] {
    return [...new Set(Array.from(this.tools.values()).map((t) => t.category))];
  }
}

const registry = new ToolRegistry();

function def(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  opts: {
    risk: ToolRiskLevel;
    approval: boolean;
    permission: string[];
    timeout: number;
    sideEffects: boolean;
    idempotent: boolean;
    category: string;
  },
  executor: (args: Record<string, unknown>, userId: string, role: string) => Promise<string>
): void {
  registry.register({
    definition: {
      name,
      description,
      parameters,
      riskLevel: opts.risk,
      requiresApproval: opts.approval,
      permission: opts.permission,
      timeout: opts.timeout,
      sideEffects: opts.sideEffects,
      idempotent: opts.idempotent,
    },
    executor,
    category: opts.category,
  });
}

// ─── Search & Read Tools (LOW RISK) ───

def(
  "search_employees",
  "Search employees by name, department, or role. Returns matching employee records.",
  {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (name, department, or role)" },
      department: { type: "string", description: "Filter by department" },
      limit: { type: "number", description: "Max results (default 10)" },
    },
    required: ["query"],
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "search" },
  async (args) => {
    const query = (args.query as string).toLowerCase();
    return JSON.stringify({ search: "employees", query, results: "Retrieved from database" });
  }
);

def(
  "get_leave_balance",
  "Get leave balance for an employee. Employees can only see their own balance.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string", description: "Employee ID (optional, defaults to current user)" },
    },
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (args, userId) => {
    return JSON.stringify({ employeeId: args.employeeId || userId, balance: "Retrieved from leave module" });
  }
);

def(
  "get_employee_details",
  "Get detailed information about a specific employee.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string", description: "Employee ID" },
    },
    required: ["employeeId"],
  },
  { risk: "low", approval: false, permission: ["admin", "manager"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (args) => {
    return JSON.stringify({ employeeId: args.employeeId, details: "Retrieved from employees module" });
  }
);

def(
  "get_analytics",
  "Get analytics data for the organization. Includes headcount, turnover, attendance metrics.",
  {
    type: "object",
    properties: {
      metric: { type: "string", description: "Specific metric to retrieve (headcount, turnover, attendance, all)" },
      department: { type: "string", description: "Filter by department" },
    },
  },
  { risk: "low", approval: false, permission: ["admin", "manager"], timeout: 15000, sideEffects: false, idempotent: true, category: "analytics" },
  async (args) => {
    return JSON.stringify({ metric: args.metric || "all", data: "Retrieved from analytics" });
  }
);

def(
  "search_documents",
  "Search for uploaded documents, HR letters, and knowledge base articles.",
  {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      type: { type: "string", description: "Document type filter" },
    },
    required: ["query"],
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "search" },
  async (args) => {
    return JSON.stringify({ query: args.query, results: "Retrieved from document store" });
  }
);

// ─── Write Tools (MEDIUM RISK) ───

def(
  "create_leave_request",
  "Submit a leave request for an employee. Employees can only submit for themselves.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string", description: "Employee ID" },
      leaveType: { type: "string", enum: ["annual", "sick", "personal", "unpaid"], description: "Type of leave" },
      startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
      endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
      reason: { type: "string", description: "Reason for leave" },
    },
    required: ["employeeId", "leaveType", "startDate", "endDate"],
  },
  { risk: "medium", approval: false, permission: ["admin", "manager", "employee"], timeout: 15000, sideEffects: true, idempotent: false, category: "leave" },
  async (args) => {
    return JSON.stringify({ action: "create_leave_request", status: "pending_approval", ...args });
  }
);

def(
  "update_task_status",
  "Update the status of an onboarding task, project task, or goal.",
  {
    type: "object",
    properties: {
      module: { type: "string", enum: ["onboarding", "projects", "goals"], description: "Module" },
      taskId: { type: "string", description: "Task ID" },
      status: { type: "string", description: "New status" },
    },
    required: ["module", "taskId", "status"],
  },
  { risk: "medium", approval: false, permission: ["admin", "manager"], timeout: 10000, sideEffects: true, idempotent: true, category: "task" },
  async (args) => {
    return JSON.stringify({ action: "update_task", ...args, status: "updated" });
  }
);

def(
  "generate_report",
  "Generate a report for a specific module (analytics, leave, recruitment, etc.).",
  {
    type: "object",
    properties: {
      module: { type: "string", description: "Module to report on" },
      dateRange: { type: "string", description: "Date range (e.g., 'last_30_days')" },
      format: { type: "string", enum: ["summary", "detailed"], description: "Report format" },
    },
    required: ["module"],
  },
  { risk: "medium", approval: false, permission: ["admin", "manager"], timeout: 30000, sideEffects: false, idempotent: true, category: "reports" },
  async (args) => {
    return JSON.stringify({ action: "generate_report", ...args, status: "generated" });
  }
);

// ─── High Risk Tools (REQUIRES APPROVAL) ───

def(
  "approve_leave_request",
  "Approve or decline a pending leave request. Requires admin or manager role.",
  {
    type: "object",
    properties: {
      requestId: { type: "string", description: "Leave request ID" },
      decision: { type: "string", enum: ["approve", "decline"], description: "Decision" },
      comment: { type: "string", description: "Optional comment" },
    },
    required: ["requestId", "decision"],
  },
  { risk: "high", approval: true, permission: ["admin", "manager"], timeout: 10000, sideEffects: true, idempotent: true, category: "leave" },
  async (args) => {
    return JSON.stringify({ action: "approve_leave", ...args, status: "processed" });
  }
);

def(
  "deactivate_employee",
  "Deactivate an employee account. This is irreversible and requires admin approval.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string", description: "Employee ID" },
      reason: { type: "string", description: "Reason for deactivation" },
    },
    required: ["employeeId", "reason"],
  },
  { risk: "high", approval: true, permission: ["admin"], timeout: 10000, sideEffects: true, idempotent: false, category: "admin" },
  async (args) => {
    return JSON.stringify({ action: "deactivate_employee", ...args, status: "pending_approval" });
  }
);

def(
  "create_team_member",
  "Create a new team member account. Requires admin role.",
  {
    type: "object",
    properties: {
      name: { type: "string", description: "Full name" },
      email: { type: "string", description: "Email address" },
      role: { type: "string", enum: ["admin", "manager", "employee"], description: "Role" },
      department: { type: "string", description: "Department" },
    },
    required: ["name", "email", "role", "department"],
  },
  { risk: "high", approval: true, permission: ["admin"], timeout: 15000, sideEffects: true, idempotent: false, category: "admin" },
  async (args) => {
    return JSON.stringify({ action: "create_team_member", ...args, status: "pending_approval" });
  }
);

export function getToolRegistry(): ToolRegistry {
  return registry;
}
