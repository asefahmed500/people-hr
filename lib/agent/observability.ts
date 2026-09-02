import { randomUUID } from "crypto";
import type { AIToolCall } from "../ai/types";
import type { UserContext } from "../context/engine";

export interface AgentTrace {
  id: string;
  requestId: string;
  userId: string;
  organizationId?: string;
  model: string;
  status: "running" | "completed" | "failed" | "cancelled";
  steps: TraceStep[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
  };
  toolCalls: { name: string; durationMs: number; success: boolean }[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
}

export interface TraceStep {
  stepNumber: number;
  type: string;
  content?: string;
  timestamp: Date;
  durationMs?: number;
}

class ObservabilityService {
  private traces: Map<string, AgentTrace> = new Map();

  startTrace(requestId: string, userId: string, model: string): AgentTrace {
    const trace: AgentTrace = {
      id: randomUUID(),
      requestId,
      userId,
      model,
      status: "running",
      steps: [],
      usage: { promptTokens: 0, completionTokens: 0, estimatedCost: 0 },
      toolCalls: [],
      startedAt: new Date(),
    };
    this.traces.set(trace.id, trace);
    return trace;
  }

  addStep(traceId: string, step: TraceStep): void {
    const trace = this.traces.get(traceId);
    if (trace) trace.steps.push(step);
  }

  completeTrace(
    traceId: string,
    status: "completed" | "failed" | "cancelled",
    usage?: { promptTokens: number; completionTokens: number; estimatedCost: number },
    error?: string
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;
    trace.status = status;
    trace.completedAt = new Date();
    trace.durationMs = trace.completedAt.getTime() - trace.startedAt.getTime();
    if (usage) trace.usage = usage;
    if (error) trace.error = error;
  }

  getTrace(traceId: string): AgentTrace | undefined {
    return this.traces.get(traceId);
  }

  getTracesForUser(userId: string, limit: number = 50): AgentTrace[] {
    return Array.from(this.traces.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  getStats(): {
    totalTraces: number;
    completed: number;
    failed: number;
    averageDurationMs: number;
    averageCost: number;
  } {
    const all = Array.from(this.traces.values());
    const completed = all.filter((t) => t.status === "completed");
    return {
      totalTraces: all.length,
      completed: completed.length,
      failed: all.filter((t) => t.status === "failed").length,
      averageDurationMs:
        completed.reduce((s, t) => s + (t.durationMs || 0), 0) / Math.max(completed.length, 1),
      averageCost:
        all.reduce((s, t) => s + t.usage.estimatedCost, 0) / Math.max(all.length, 1),
    };
  }
}

let _obs: ObservabilityService | null = null;

export function getObservability(): ObservabilityService {
  if (!_obs) _obs = new ObservabilityService();
  return _obs;
}
