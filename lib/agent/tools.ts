import type { AIToolDefinition } from "../ai/types";
import type { UserContext } from "../context/engine";
import { prisma } from "../db";
import { computeAnalytics } from "../analytics";
import type { Employee } from "../data/employees";
import type { Balances, LeaveRequest, LeaveStore } from "../data/leave";
import { defaultBalances } from "../data/leave";
import type { RecruitmentStore } from "../data/recruitment";
import type { ProjectsStore } from "../data/projects";
import type { GoalsStore, Objective } from "../data/goals";
import type { DocumentsStore } from "../data/documents";

export type ToolRiskLevel = "low" | "medium" | "high";
export type ToolExecutor = (args: Record<string, unknown>, user: UserContext) => Promise<string>;

/** Shared by the registry, the orchestrator and the approval route so an
 *  unavailable write action can never be reported as a successful side effect. */
export const TOOL_UNAVAILABLE_ERROR =
  "This action is not available in the agent yet; use the module UI.";

export interface ToolMetadata {
  definition: AIToolDefinition;
  executor: ToolExecutor;
  category: string;
  /** False for actions the agent cannot actually perform. They stay
   *  registered (so callers get an honest refusal) but are never executed. */
  available: boolean;
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
    available?: boolean;
  },
  executor: ToolExecutor
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
    available: opts.available !== false,
  });
}

// ─── Shared data access + role scoping ───

// Shared feature modules live under one workspace document, exactly as in
// app/api/store/[key]/route.ts. There is no separate agent data store.
const WORKSPACE_ID = "__workspace__";

const EMPTY_LEAVE: LeaveStore = { requests: [], balances: {} };
const EMPTY_RECRUITMENT: RecruitmentStore = { candidates: [], openings: [] };

async function readWorkspaceDoc<T>(key: string): Promise<T | null> {
  const doc = await prisma.moduleState.findUnique({
    where: { userId_key: { userId: WORKSPACE_ID, key } },
  });
  return (doc?.data as unknown as T | null) ?? null;
}

function ok(data: Record<string, unknown>): string {
  return JSON.stringify({ ok: true, ...data });
}

function unavailable(): string {
  return JSON.stringify({ ok: false, error: TOOL_UNAVAILABLE_ERROR });
}

function unavailableFor(subject: string): string {
  return JSON.stringify({
    ok: false,
    error: `${subject} is not available in the agent yet; use the module UI.`,
  });
}

function stringArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value.trim() : "";
}

function limitArg(args: Record<string, unknown>, fallback: number, max: number): number {
  const value = args.limit;
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value), 1), max);
}

function countBy<T>(rows: T[], keyOf: (row: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = keyOf(row) || "Unspecified";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

// Mirrors the store route's read scoping: admins see everything, managers see
// their department, employees (and managers with no department) see themselves.
function isSelfScoped(user: UserContext): boolean {
  return user.role === "employee" || !user.department;
}

function matchesIdentity(row: { name?: string; email?: string }, user: UserContext): boolean {
  return (
    (!!row.email && !!user.email && row.email === user.email) ||
    (!!row.name && !!user.name && row.name === user.name)
  );
}

function scopedEmployees(all: Employee[], user: UserContext): Employee[] {
  if (user.role === "admin") return all;
  if (isSelfScoped(user)) return all.filter((e) => matchesIdentity(e, user));
  return all.filter((e) => e.department === user.department);
}

function canViewBalance(user: UserContext, employeeId: string, employees: Employee[]): boolean {
  if (user.role === "admin" || employeeId === user.userId) return true;
  if (isSelfScoped(user)) return false;
  return employees.some((e) => e.id === employeeId && e.department === user.department);
}

function scopedLeaveRequests(
  requests: LeaveRequest[],
  employees: Employee[],
  user: UserContext
): LeaveRequest[] {
  if (user.role === "admin") return requests;
  if (isSelfScoped(user)) {
    return requests.filter((r) => r.employeeId === user.userId || r.employeeName === user.name);
  }
  const deptById = new Map(employees.map((e) => [e.id, e.department]));
  const deptByName = new Map(employees.map((e) => [e.name, e.department]));
  return requests.filter(
    (r) =>
      deptById.get(r.employeeId) === user.department ||
      deptByName.get(r.employeeName) === user.department
  );
}

type OwnedRow = { ownerName?: string; department?: string };

function scopedOwnedRows<T extends OwnedRow>(rows: T[], user: UserContext): T[] {
  if (user.role === "admin") return rows;
  if (isSelfScoped(user)) return rows.filter((r) => !!r.ownerName && r.ownerName === user.name);
  return rows.filter((r) => r.department === user.department);
}

function scopedObjectives(objectives: Objective[], user: UserContext): Objective[] {
  if (user.role === "admin") return objectives;
  return objectives.filter((o) => !!o.ownerName && o.ownerName === user.name);
}

type Analytics = ReturnType<typeof computeAnalytics>;

function metricValue(analytics: Analytics, metric: string): unknown {
  switch (metric) {
    case "headcount":
      return analytics.headcount;
    case "turnover":
    case "attrition":
      return analytics.attrition;
    case "tenure":
      return analytics.avgTenure;
    case "offer_accept_rate":
    case "offeraccept":
      return analytics.offerAcceptRate;
    case "by_department":
    case "bydepartment":
      return analytics.byDept;
    case "by_tenure":
    case "bytenure":
      return analytics.byTenure;
    case "monthly_trend":
    case "monthlytrend":
      return analytics.monthlyTrend;
    default:
      return null;
  }
}

// ─── Search & Read Tools (LOW RISK) — real ModuleState reads ───

def(
  "search_employees",
  "Search employees by name, department, or role. Results are scoped to the caller (admins see all, managers their department, employees themselves).",
  {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (name, department, or role)" },
      department: { type: "string", description: "Filter by department" },
      limit: { type: "number", description: "Max results (default 10, max 50)" },
    },
    required: ["query"],
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "search" },
  async (args, user) => {
    const query = stringArg(args, "query").toLowerCase();
    const department = stringArg(args, "department");
    const limit = limitArg(args, 10, 50);
    const employees = scopedEmployees((await readWorkspaceDoc<Employee[]>("employees")) ?? [], user);
    const matches = employees
      .filter((e) => {
        if (department && e.department !== department) return false;
        if (!query) return true;
        return [e.name, e.email, e.role, e.department].some(
          (value) => typeof value === "string" && value.toLowerCase().includes(query)
        );
      })
      .slice(0, limit);
    return ok({ tool: "search_employees", query, count: matches.length, employees: matches });
  }
);

def(
  "get_leave_balance",
  "Get leave balance for an employee. Employees can only see their own balance; managers only their department's.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string", description: "Employee ID (optional, defaults to current user)" },
    },
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (args, user) => {
    const employeeId = stringArg(args, "employeeId") || user.userId;
    const employees = (await readWorkspaceDoc<Employee[]>("employees")) ?? [];
    if (!canViewBalance(user, employeeId, employees)) {
      return JSON.stringify({ ok: false, error: "You don't have access to that employee's leave balance." });
    }
    const store = (await readWorkspaceDoc<LeaveStore>("leave")) ?? EMPTY_LEAVE;
    const balance: Balances = store.balances[employeeId] ?? defaultBalances;
    return ok({ tool: "get_leave_balance", employeeId, balance });
  }
);

def(
  "list_leave_requests",
  "List leave requests with their status. Scoped to the caller's own records, department, or the whole workspace for admins.",
  { type: "object", properties: {} },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (_args, user) => {
    const store = (await readWorkspaceDoc<LeaveStore>("leave")) ?? EMPTY_LEAVE;
    const employees = (await readWorkspaceDoc<Employee[]>("employees")) ?? [];
    const requests = scopedLeaveRequests(store.requests, employees, user);
    return ok({ tool: "list_leave_requests", count: requests.length, requests });
  }
);

def(
  "get_employee_details",
  "Get detailed information about a specific employee. Scoped to the caller's visibility.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string", description: "Employee ID, email, or name" },
    },
    required: ["employeeId"],
  },
  { risk: "low", approval: false, permission: ["admin", "manager"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (args, user) => {
    const employeeId = stringArg(args, "employeeId");
    const employees = scopedEmployees((await readWorkspaceDoc<Employee[]>("employees")) ?? [], user);
    const employee =
      employees.find((e) => e.id === employeeId || e.email === employeeId || e.name === employeeId) ?? null;
    return ok({ tool: "get_employee_details", employeeId, found: employee !== null, employee });
  }
);

def(
  "get_analytics",
  "Get analytics computed live from the real employees, leave, and recruitment documents. Non-admins get a scoped view derived only from data they can see.",
  {
    type: "object",
    properties: {
      metric: { type: "string", description: "Specific metric (headcount, turnover, tenure, offer_accept_rate, by_department, by_tenure, monthly_trend, all)" },
      department: { type: "string", description: "Filter by department" },
    },
  },
  { risk: "low", approval: false, permission: ["admin", "manager"], timeout: 15000, sideEffects: false, idempotent: true, category: "analytics" },
  async (args, user) => {
    const metric = stringArg(args, "metric").toLowerCase() || "all";
    const department = stringArg(args, "department");
    let employees = scopedEmployees((await readWorkspaceDoc<Employee[]>("employees")) ?? [], user);
    if (department) employees = employees.filter((e) => e.department === department);
    const leave = (await readWorkspaceDoc<LeaveStore>("leave")) ?? EMPTY_LEAVE;
    const recruitment =
      user.role === "admin"
        ? (await readWorkspaceDoc<RecruitmentStore>("recruitment")) ?? EMPTY_RECRUITMENT
        : EMPTY_RECRUITMENT;
    const analytics = computeAnalytics({ employees, leave, recruitment });
    const data = metric === "all" ? analytics : { metric, value: metricValue(analytics, metric) };
    return ok({
      tool: "get_analytics",
      metric,
      department: department || null,
      scope: user.role === "admin" ? "workspace" : user.department ? "department" : "self",
      data,
    });
  }
);

def(
  "summarize_headcount",
  "Summarize headcount from the real employee directory, scoped to the caller's visibility.",
  { type: "object", properties: {} },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "analytics" },
  async (_args, user) => {
    const employees = scopedEmployees((await readWorkspaceDoc<Employee[]>("employees")) ?? [], user);
    const active = employees.filter((e) => e.status !== "inactive");
    return ok({
      tool: "summarize_headcount",
      scope: user.role === "admin" ? "workspace" : user.department ? "department" : "self",
      total: employees.length,
      active: active.length,
      byDepartment: countBy(active, (e) => e.department),
      byStatus: countBy(employees, (e) => e.status),
    });
  }
);

def(
  "list_projects",
  "List project tasks. Scoped to the caller's own tasks, department, or the whole workspace for admins.",
  {
    type: "object",
    properties: {
      status: { type: "string", description: "Filter by task status" },
    },
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (args, user) => {
    const status = stringArg(args, "status");
    const store = (await readWorkspaceDoc<ProjectsStore>("projects")) ?? { tasks: [] };
    const tasks = scopedOwnedRows(store.tasks, user).filter((t) => !status || t.status === status);
    return ok({ tool: "list_projects", count: tasks.length, tasks });
  }
);

def(
  "list_goals",
  "List goals/objectives. Non-admins only see objectives they own.",
  {
    type: "object",
    properties: {
      status: { type: "string", description: "Filter by goal status" },
    },
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "read" },
  async (args, user) => {
    const status = stringArg(args, "status");
    const store = (await readWorkspaceDoc<GoalsStore>("goals")) ?? { objectives: [] };
    const objectives = scopedObjectives(store.objectives, user).filter(
      (o) => !status || o.status === status
    );
    return ok({ tool: "list_goals", count: objectives.length, objectives });
  }
);

def(
  "list_openings",
  "List recruitment openings. Administrator-only — recruitment data is not exposed to other roles.",
  {
    type: "object",
    properties: {
      department: { type: "string", description: "Filter by department" },
    },
  },
  { risk: "low", approval: false, permission: ["admin"], timeout: 10000, sideEffects: false, idempotent: true, category: "recruitment" },
  async (args, user) => {
    if (user.role !== "admin") {
      return ok({ tool: "list_openings", count: 0, openings: [], note: "Recruitment data is limited to administrators." });
    }
    const department = stringArg(args, "department");
    const store = (await readWorkspaceDoc<RecruitmentStore>("recruitment")) ?? EMPTY_RECRUITMENT;
    const openings = department
      ? store.openings.filter((o) => o.department === department)
      : store.openings;
    return ok({ tool: "list_openings", count: openings.length, openings });
  }
);

def(
  "list_candidates",
  "List recruitment candidates. Administrator-only — recruitment data is not exposed to other roles.",
  {
    type: "object",
    properties: {
      stage: { type: "string", description: "Filter by pipeline stage" },
    },
  },
  { risk: "low", approval: false, permission: ["admin"], timeout: 10000, sideEffects: false, idempotent: true, category: "recruitment" },
  async (args, user) => {
    if (user.role !== "admin") {
      return ok({ tool: "list_candidates", count: 0, candidates: [], note: "Recruitment data is limited to administrators." });
    }
    const stage = stringArg(args, "stage");
    const store = (await readWorkspaceDoc<RecruitmentStore>("recruitment")) ?? EMPTY_RECRUITMENT;
    const candidates = stage ? store.candidates.filter((c) => c.stage === stage) : store.candidates;
    return ok({ tool: "list_candidates", count: candidates.length, candidates });
  }
);

def(
  "search_documents",
  "Search HR document metadata. Administrator-only — other roles get an empty result.",
  {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      type: { type: "string", description: "Document type filter" },
    },
    required: ["query"],
  },
  { risk: "low", approval: false, permission: ["admin", "manager", "employee"], timeout: 10000, sideEffects: false, idempotent: true, category: "search" },
  async (args, user) => {
    const query = stringArg(args, "query").toLowerCase();
    if (user.role !== "admin") {
      return ok({
        tool: "search_documents",
        query,
        count: 0,
        documents: [],
        note: "Document search is limited to administrators.",
      });
    }
    const type = stringArg(args, "type").toLowerCase();
    const store = (await readWorkspaceDoc<DocumentsStore>("documents")) ?? { documents: [] };
    const documents = store.documents
      .filter((d) => {
        if (type && d.type !== type && d.title.toLowerCase() !== type) return false;
        if (!query) return true;
        return [d.title, d.refNo, d.employeeName, d.department, d.jobTitle, d.type].some(
          (value) => typeof value === "string" && value.toLowerCase().includes(query)
        );
      })
      // Never stream stored HTML bodies back through the model.
      .map((d) => ({
        id: d.id,
        type: d.type,
        title: d.title,
        refNo: d.refNo,
        status: d.status,
        employeeName: d.employeeName,
        department: d.department,
        jobTitle: d.jobTitle,
        issueDate: d.issueDate,
        createdBy: d.createdBy,
        createdAt: d.createdAt,
      }));
    return ok({ tool: "search_documents", query, count: documents.length, documents });
  }
);

// ─── Report tool — a real summary of the caller's visible data ───

def(
  "generate_report",
  "Generate a summary report from real HR module data. No files are created or saved.",
  {
    type: "object",
    properties: {
      module: { type: "string", description: "Module to report on (employees, leave, recruitment, projects, goals, analytics)" },
      dateRange: { type: "string", description: "Ignored — reports always reflect current stored data" },
      format: { type: "string", enum: ["summary", "detailed"], description: "Report format" },
    },
    required: ["module"],
  },
  { risk: "medium", approval: false, permission: ["admin", "manager"], timeout: 30000, sideEffects: false, idempotent: true, category: "reports" },
  async (args, user) => {
    const moduleName = stringArg(args, "module").toLowerCase();
    const format = args.format === "detailed" ? "detailed" : "summary";
    const generatedAt = new Date().toISOString();

    switch (moduleName) {
      case "employees": {
        const rows = scopedEmployees((await readWorkspaceDoc<Employee[]>("employees")) ?? [], user);
        const active = rows.filter((e) => e.status !== "inactive");
        return ok({
          tool: "generate_report", module: moduleName, format, generatedAt,
          summary: { total: rows.length, active: active.length, byDepartment: countBy(active, (e) => e.department) },
          ...(format === "detailed" ? { rows } : {}),
        });
      }
      case "leave": {
        const store = (await readWorkspaceDoc<LeaveStore>("leave")) ?? EMPTY_LEAVE;
        const employees = (await readWorkspaceDoc<Employee[]>("employees")) ?? [];
        const requests = scopedLeaveRequests(store.requests, employees, user);
        return ok({
          tool: "generate_report", module: moduleName, format, generatedAt,
          summary: { total: requests.length, byStatus: countBy(requests, (r) => r.status) },
          ...(format === "detailed" ? { requests } : {}),
        });
      }
      case "recruitment": {
        if (user.role !== "admin") {
          return ok({ tool: "generate_report", module: moduleName, format, generatedAt, summary: { total: 0, byStage: {}, note: "Recruitment data is limited to administrators." } });
        }
        const store = (await readWorkspaceDoc<RecruitmentStore>("recruitment")) ?? EMPTY_RECRUITMENT;
        return ok({
          tool: "generate_report", module: moduleName, format, generatedAt,
          summary: { candidates: store.candidates.length, openings: store.openings.length, byStage: countBy(store.candidates, (c) => c.stage) },
          ...(format === "detailed" ? { candidates: store.candidates, openings: store.openings } : {}),
        });
      }
      case "projects": {
        const store = (await readWorkspaceDoc<ProjectsStore>("projects")) ?? { tasks: [] };
        const tasks = scopedOwnedRows(store.tasks, user);
        return ok({
          tool: "generate_report", module: moduleName, format, generatedAt,
          summary: { total: tasks.length, byStatus: countBy(tasks, (t) => t.status) },
          ...(format === "detailed" ? { tasks } : {}),
        });
      }
      case "goals": {
        const store = (await readWorkspaceDoc<GoalsStore>("goals")) ?? { objectives: [] };
        const objectives = scopedObjectives(store.objectives, user);
        return ok({
          tool: "generate_report", module: moduleName, format, generatedAt,
          summary: { total: objectives.length, byStatus: countBy(objectives, (o) => o.status)},
          ...(format === "detailed" ? { objectives } : {}),
        });
      }
      case "analytics": {
        const employees = scopedEmployees((await readWorkspaceDoc<Employee[]>("employees")) ?? [], user);
        const leave = (await readWorkspaceDoc<LeaveStore>("leave")) ?? EMPTY_LEAVE;
        const recruitment =
          user.role === "admin"
            ? (await readWorkspaceDoc<RecruitmentStore>("recruitment")) ?? EMPTY_RECRUITMENT
            : EMPTY_RECRUITMENT;
        const analytics = computeAnalytics({ employees, leave, recruitment });
        return ok({ tool: "generate_report", module: moduleName, format, generatedAt, summary: analytics });
      }
      default:
        return unavailableFor(`A '${moduleName || "unknown"}' report`);
    }
  }
);

// ─── Write Tools — honestly unavailable in the agent ───
// These used to return fake "pending_approval"/"processed"/"updated" strings.
// They never performed a write, so they now return a structured refusal. No
// side effect is ever claimed. Use the module UI for these actions.

def(
  "create_leave_request",
  "Not available in the agent yet — submit leave requests in the Leave module UI.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string" },
      leaveType: { type: "string", enum: ["annual", "sick", "personal", "unpaid"] },
      startDate: { type: "string" },
      endDate: { type: "string" },
      reason: { type: "string" },
    },
    required: ["employeeId", "leaveType", "startDate", "endDate"],
  },
  { risk: "medium", approval: false, permission: ["admin", "manager", "employee"], timeout: 15000, sideEffects: true, idempotent: false, category: "leave", available: false },
  async () => unavailable()
);

def(
  "update_task_status",
  "Not available in the agent yet — update tasks in the Onboarding, Projects, or Goals module UI.",
  {
    type: "object",
    properties: {
      module: { type: "string", enum: ["onboarding", "projects", "goals"] },
      taskId: { type: "string" },
      status: { type: "string" },
    },
    required: ["module", "taskId", "status"],
  },
  { risk: "medium", approval: false, permission: ["admin", "manager"], timeout: 10000, sideEffects: true, idempotent: true, category: "task", available: false },
  async () => unavailable()
);

// ─── High Risk Tools (REQUIRES APPROVAL) — also unavailable ───

def(
  "approve_leave_request",
  "Not available in the agent yet — approve leave requests in the Leave module UI.",
  {
    type: "object",
    properties: {
      requestId: { type: "string" },
      decision: { type: "string", enum: ["approve", "decline"] },
      comment: { type: "string" },
    },
    required: ["requestId", "decision"],
  },
  { risk: "high", approval: true, permission: ["admin", "manager"], timeout: 10000, sideEffects: true, idempotent: true, category: "leave", available: false },
  async () => unavailable()
);

def(
  "deactivate_employee",
  "Not available in the agent yet — deactivate employees in the People module UI.",
  {
    type: "object",
    properties: {
      employeeId: { type: "string" },
      reason: { type: "string" },
    },
    required: ["employeeId", "reason"],
  },
  { risk: "high", approval: true, permission: ["admin"], timeout: 10000, sideEffects: true, idempotent: false, category: "admin", available: false },
  async () => unavailable()
);

def(
  "create_team_member",
  "Not available in the agent yet — create team members in the People module UI.",
  {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      role: { type: "string", enum: ["admin", "manager", "employee"] },
      department: { type: "string" },
    },
    required: ["name", "email", "role", "department"],
  },
  { risk: "high", approval: true, permission: ["admin"], timeout: 15000, sideEffects: true, idempotent: false, category: "admin", available: false },
  async () => unavailable()
);

export function getToolRegistry(): ToolRegistry {
  return registry;
}
