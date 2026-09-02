/* eslint-disable @typescript-eslint/no-explicit-any -- automation engine processes dynamic module data */
import type {
  AutomationEvent,
  AutomationAction,
  AutomationContext,
  AutomationRule,
} from "./rules";
import { getRulesForModule } from "./rules";
import { pushNotification } from "../stores/notifications";

export interface AutomationResult {
  eventId: string;
  actions: AutomationAction[];
  notifications: number;
  processedAt: Date;
}

export class AutomationEngine {
  async processEvent(
    event: AutomationEvent,
    context: AutomationContext
  ): Promise<AutomationResult> {
    const rules = getRulesForModule(event.module);
    const allActions: AutomationAction[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.trigger !== event.type && rule.trigger !== "periodic") continue;

      try {
        if (rule.condition(context)) {
          const actions = await rule.action(context);
          allActions.push(...actions);
        }
      } catch {}
    }

    let notifications = 0;
    for (const action of allActions) {
      if (action.type === "notify" && action.target && action.title) {
        try {
          await pushNotification({
            type: "automation_alert",
            title: action.title,
            description: action.message || "",
            href: action.module ? `/${action.module}` : undefined,
          });
          notifications++;
        } catch {}
      }
    }

    return {
      eventId: crypto.randomUUID(),
      actions: allActions,
      notifications,
      processedAt: new Date(),
    };
  }

  async runPeriodicChecks(data: {
    employees: any[];
    leave: any;
    recruitment: any;
    onboarding: any;
    goals: any;
    projects: any;
    performance: any;
    attendance?: any;
  }): Promise<AutomationResult> {
    const rules = getRulesForModule("leave")
      .concat(getRulesForModule("onboarding"))
      .concat(getRulesForModule("recruitment"))
      .concat(getRulesForModule("goals"))
      .concat(getRulesForModule("projects"))
      .concat(getRulesForModule("performance"))
      .concat(getRulesForModule("attendance"))
      .filter((r) => r.trigger === "on_read" || r.trigger === "periodic");

    const context: AutomationContext = {
      module: "periodic",
      event: {
        type: "periodic",
        module: "periodic",
        entity: {},
        timestamp: new Date(),
      },
      data: { checkins: data.attendance?.checkIns || [] },
      employees: data.employees,
      leave: data.leave,
      recruitment: data.recruitment,
      onboarding: data.onboarding,
      goals: data.goals,
      projects: data.projects,
      performance: data.performance,
    };

    const allActions: AutomationAction[] = [];
    for (const rule of rules) {
      try {
        if (rule.condition(context)) {
          const actions = await rule.action(context);
          allActions.push(...actions);
        }
      } catch {}
    }

    let notifications = 0;
    for (const action of allActions) {
      if (action.type === "notify" && action.target && action.title) {
        try {
          await pushNotification({
            type: "automation_alert",
            title: action.title,
            description: action.message || "",
            href: action.module ? `/${action.module}` : undefined,
          });
          notifications++;
        } catch {}
      }
    }

    return {
      eventId: crypto.randomUUID(),
      actions: allActions,
      notifications,
      processedAt: new Date(),
    };
  }
}

let _engine: AutomationEngine | null = null;

export function getAutomationEngine(): AutomationEngine {
  if (!_engine) _engine = new AutomationEngine();
  return _engine;
}
