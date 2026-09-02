/* eslint-disable @typescript-eslint/no-explicit-any -- automation rules work with dynamic module data shapes */
import type { Employee } from "../data/employees";
import type { LeaveStore } from "../data/leave";
import type { RecruitmentStore } from "../data/recruitment";
import type { OnboardingStore } from "../data/onboarding";
import type { GoalsStore } from "../data/goals";
import type { ProjectsStore } from "../data/projects";
import type { PerformanceStore } from "../data/performance";

export interface AutomationEvent {
  type: string;
  module: string;
  entity: Record<string, unknown>;
  timestamp: Date;
  actorId?: string;
  data?: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  module: string;
  trigger: "on_write" | "on_read" | "periodic" | "on_create" | "on_status_change";
  condition: (ctx: AutomationContext) => boolean;
  action: (ctx: AutomationContext) => Promise<AutomationAction[]>;
  enabled: boolean;
}

export interface AutomationContext {
  module: string;
  event: AutomationEvent;
  data: Record<string, unknown>;
  employees: Employee[];
  leave: LeaveStore;
  recruitment: RecruitmentStore;
  onboarding: OnboardingStore;
  goals: GoalsStore;
  projects: ProjectsStore;
  performance: PerformanceStore;
}

export interface AutomationAction {
  type: "notify" | "update" | "flag";
  target?: string;
  title?: string;
  message?: string;
  severity?: "info" | "warning" | "urgent";
  module?: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400_000);
}

const rules: AutomationRule[] = [
  // ─── Leave Rules ───
  {
    id: "leave-stale-pending",
    name: "Escalate stale leave requests",
    module: "leave",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const reqs = (ctx.leave as any).requests || [];
      return reqs.some(
        (r: any) =>
          r.status === "pending" &&
          daysBetween(new Date(r.createdAt || Date.now()), new Date()) > 2
      );
    },
    action: async (ctx) => {
      const reqs = (ctx.leave as any).requests || [];
      const stale = reqs.filter(
        (r: any) =>
          r.status === "pending" &&
          daysBetween(new Date(r.createdAt || Date.now()), new Date()) > 2
      );
      return stale.map((r: any) => ({
        type: "notify" as const,
        target: "admin",
        title: "Leave request pending > 48h",
        message: `${r.employeeName}'s ${r.type} leave from ${r.startDate} needs review.`,
        severity: "warning" as const,
        module: "leave",
      }));
    },
  },
  {
    id: "leave-low-balance",
    name: "Warn low leave balance",
    module: "leave",
    trigger: "on_write",
    enabled: true,
    condition: (ctx) => {
      const balances = (ctx.leave as any).balances || [];
      return balances.some((b: any) => {
        const total = (b.annual || 0) + (b.sick || 0) + (b.personal || 0);
        const used = (b.usedAnnual || 0) + (b.usedSick || 0) + (b.usedPersonal || 0);
        return total - used < 3;
      });
    },
    action: async (ctx) => {
      const balances = (ctx.leave as any).balances || [];
      const low = balances.filter((b: any) => {
        const total = (b.annual || 0) + (b.sick || 0) + (b.personal || 0);
        const used = (b.usedAnnual || 0) + (b.usedSick || 0) + (b.usedPersonal || 0);
        return total - used < 3;
      });
      return low.map((b: any) => ({
        type: "notify" as const,
        target: b.employeeId,
        title: "Low leave balance",
        message: `You have less than 3 days of leave remaining. Consider planning accordingly.`,
        severity: "info" as const,
        module: "leave",
      }));
    },
  },

  // ─── Onboarding Rules ───
  {
    id: "onboarding-phase-complete",
    name: "Auto-advance onboarding phase",
    module: "onboarding",
    trigger: "on_write",
    enabled: true,
    condition: (ctx) => {
      const tasks = (ctx.onboarding as any).tasks || [];
      const phases = ["pre", "w1", "m1", "ramped"];
      for (const phase of phases.slice(0, -1)) {
        const phaseTasks = tasks.filter((t: any) => t.phase === phase);
        if (phaseTasks.length > 0 && phaseTasks.every((t: any) => t.done)) {
          return true;
        }
      }
      return false;
    },
    action: async (ctx) => {
      const tasks = (ctx.onboarding as any).tasks || [];
      const phases = ["pre", "w1", "m1", "ramped"];
      const actions: AutomationAction[] = [];
      for (let i = 0; i < phases.length - 1; i++) {
        const phase = phases[i];
        const phaseTasks = tasks.filter((t: any) => t.phase === phase);
        if (phaseTasks.length > 0 && phaseTasks.every((t: any) => t.done)) {
          actions.push({
            type: "notify",
            target: "admin",
            title: `Onboarding phase complete`,
            message: `All "${phase}" tasks are done. Ready to advance to the next phase.`,
            severity: "info",
            module: "onboarding",
          });
        }
      }
      return actions;
    },
  },
  {
    id: "onboarding-stale-task",
    name: "Flag overdue onboarding tasks",
    module: "onboarding",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const tasks = (ctx.onboarding as any).tasks || [];
      return tasks.some((t: any) => !t.done && t.dueDate && new Date(t.dueDate) < new Date());
    },
    action: async (ctx) => {
      const tasks = (ctx.onboarding as any).tasks || [];
      const overdue = tasks.filter(
        (t: any) => !t.done && t.dueDate && new Date(t.dueDate) < new Date()
      );
      return overdue.slice(0, 3).map((t: any) => ({
        type: "notify" as const,
        target: "admin",
        title: "Onboarding task overdue",
        message: `"${t.title}" for ${t.hireName} was due ${t.dueDate}.`,
        severity: "warning" as const,
        module: "onboarding",
      }));
    },
  },

  // ─── Recruitment Rules ───
  {
    id: "recruitment-stale-candidate",
    name: "Flag stale candidates",
    module: "recruitment",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const candidates = (ctx.recruitment as any).candidates || [];
      return candidates.some(
        (c: any) =>
          c.stage !== "hired" &&
          c.stage !== "rejected" &&
          daysBetween(new Date(c.appliedAt || Date.now()), new Date()) > 14
      );
    },
    action: async (ctx) => {
      const candidates = (ctx.recruitment as any).candidates || [];
      const stale = candidates
        .filter(
          (c: any) =>
            c.stage !== "hired" &&
            c.stage !== "rejected" &&
            daysBetween(new Date(c.appliedAt || Date.now()), new Date()) > 14
        )
        .slice(0, 3);
      return stale.map((c: any) => ({
        type: "notify" as const,
        target: "admin",
        title: "Candidate in stage > 14 days",
        message: `${c.name} has been in "${c.stage}" for over 2 weeks.`,
        severity: "warning" as const,
        module: "recruitment",
      }));
    },
  },

  // ─── Goals Rules ───
  {
    id: "goals-deadline-approaching",
    name: "Warn approaching goal deadlines",
    module: "goals",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const objectives = (ctx.goals as any).objectives || [];
      return objectives.some((o: any) => {
        if (!o.deadline || o.progress >= 100) return false;
        const daysLeft = daysBetween(new Date(), new Date(o.deadline));
        return daysLeft <= 7 && daysLeft >= 0;
      });
    },
    action: async (ctx) => {
      const objectives = (ctx.goals as any).objectives || [];
      const urgent = objectives
        .filter((o: any) => {
          if (!o.deadline || o.progress >= 100) return false;
          const daysLeft = daysBetween(new Date(), new Date(o.deadline));
          return daysLeft <= 7 && daysLeft >= 0;
        })
        .slice(0, 3);
      return urgent.map((o: any) => ({
        type: "notify" as const,
        target: o.owner || "admin",
        title: "Goal deadline approaching",
        message: `"${o.title}" is due in ${daysBetween(new Date(), new Date(o.deadline))} days (${o.progress}% complete).`,
        severity: "warning" as const,
        module: "goals",
      }));
    },
  },
  {
    id: "goals-overdue",
    name: "Flag overdue goals",
    module: "goals",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const objectives = (ctx.goals as any).objectives || [];
      return objectives.some(
        (o: any) => o.deadline && new Date(o.deadline) < new Date() && o.progress < 100
      );
    },
    action: async (ctx) => {
      const objectives = (ctx.goals as any).objectives || [];
      const overdue = objectives
        .filter((o: any) => o.deadline && new Date(o.deadline) < new Date() && o.progress < 100)
        .slice(0, 3);
      return overdue.map((o: any) => ({
        type: "notify" as const,
        target: o.owner || "admin",
        title: "Goal overdue",
        message: `"${o.title}" was due ${o.deadline} and is ${o.progress}% complete.`,
        severity: "urgent" as const,
        module: "goals",
      }));
    },
  },

  // ─── Projects Rules ───
  {
    id: "projects-at-risk",
    name: "Flag at-risk projects",
    module: "projects",
    trigger: "on_write",
    enabled: true,
    condition: (ctx) => {
      const tasks = (ctx.projects as any).tasks || [];
      return tasks.some((t: any) => t.status === "at-risk" || t.status === "delayed");
    },
    action: async (ctx) => {
      const tasks = (ctx.projects as any).tasks || [];
      const flagged = tasks
        .filter((t: any) => t.status === "at-risk" || t.status === "delayed")
        .slice(0, 3);
      return flagged.map((t: any) => ({
        type: "notify" as const,
        target: t.owner || "admin",
        title: `Project ${t.status === "delayed" ? "delayed" : "at risk"}`,
        message: `"${t.name}" needs attention. Current status: ${t.status}.`,
        severity: t.status === "delayed" ? "urgent" : "warning",
        module: "projects",
      }));
    },
  },

  // ─── Performance Rules ───
  {
    id: "performance-reviews-overdue",
    name: "Remind overdue performance reviews",
    module: "performance",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const reviews = (ctx.performance as any).reviews || [];
      return reviews.some((r: any) => r.status === "pending" && r.dueDate && new Date(r.dueDate) < new Date());
    },
    action: async (ctx) => {
      const reviews = (ctx.performance as any).reviews || [];
      const overdue = reviews
        .filter((r: any) => r.status === "pending" && r.dueDate && new Date(r.dueDate) < new Date())
        .slice(0, 3);
      return overdue.map((r: any) => ({
        type: "notify" as const,
        target: r.reviewerId || "admin",
        title: "Performance review overdue",
        message: `Review for ${r.employeeName} was due ${r.dueDate}.`,
        severity: "warning" as const,
        module: "performance",
      }));
    },
  },

  // ─── Attendance Rules ───
  {
    id: "attendance-no-checkin",
    name: "Flag missing check-ins",
    module: "attendance",
    trigger: "on_read",
    enabled: true,
    condition: (ctx) => {
      const today = todayISO();
      const checkins = (ctx.data as any)?.checkins || [];
      return checkins.filter((c: any) => c.date === today).length < ctx.employees.filter((e) => e.status === "active").length;
    },
    action: async (ctx) => {
      const today = todayISO();
      const checkins = (ctx.data as any)?.checkins || [];
      const checkedIn = new Set(checkins.filter((c: any) => c.date === today).map((c: any) => c.employeeName));
      const missing = ctx.employees
        .filter((e) => e.status === "active" && !checkedIn.has(e.name))
        .slice(0, 3);
      if (missing.length === 0) return [];
      return [
        {
          type: "notify" as const,
          target: "admin",
          title: "Missing check-ins today",
          message: `${missing.length} employee${missing.length === 1 ? " has" : "s have"} not checked in: ${missing.map((e) => e.name).join(", ")}.`,
          severity: "info" as const,
          module: "attendance",
        },
      ];
    },
  },
];

export function getAutomationRules(): AutomationRule[] {
  return rules;
}

export function getRulesForModule(module: string): AutomationRule[] {
  return rules.filter((r) => r.module === module && r.enabled);
}
