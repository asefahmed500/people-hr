// Server-bound approval tokens. An approval is not just a boolean the client
// sends back: the server creates a short-lived token tied to the signed-in
// user, the exact tool and the exact arguments, and consumes it once.

import { createHash, randomUUID } from "crypto"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

const SCOPE = "__approval__"
const TTL_MS = 5 * 60_000

export type PendingApproval = {
  toolName: string
  args: Record<string, unknown>
  description: string
}

type ApprovalRecord = {
  userId: string
  toolName: string
  argsHash: string
  expiresAt: number
  usedAt?: string
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

export const hashApprovalArgs = (args: Record<string, unknown>): string =>
  createHash("sha256").update(stableStringify(args)).digest("hex")

/** Issue one token per pending approval. Best-effort: if the store is down,
 *  no token is returned and the client cannot approve (fail closed). */
export async function createApprovals(
  userId: string,
  pending: PendingApproval[],
): Promise<Array<PendingApproval & { approvalId: string }>> {
  const issued: Array<PendingApproval & { approvalId: string }> = []
  for (const item of pending) {
    const approvalId = `ap-${randomUUID()}`
    const record: ApprovalRecord = {
      userId,
      toolName: item.toolName,
      argsHash: hashApprovalArgs(item.args),
      expiresAt: Date.now() + TTL_MS,
    }
    try {
      await prisma.moduleState.create({
        data: { userId: SCOPE, key: approvalId, data: record as unknown as Prisma.InputJsonValue },
      })
      issued.push({ ...item, approvalId })
    } catch {
      // Fail closed — no token means the approval endpoint will reject.
    }
  }
  return issued
}

export type ConsumeResult = { ok: true } | { ok: false; error: string; status: number }

/** Validate and atomically consume a token. Marks it used before the executor
 *  runs so a captured token cannot be replayed. */
export async function consumeApproval(input: {
  approvalId: string
  userId: string
  toolName: string
  args: Record<string, unknown>
}): Promise<ConsumeResult> {
  let row: { id: string; updatedAt: Date; data: Prisma.JsonValue } | null = null
  try {
    row = await prisma.moduleState.findUnique({
      where: { userId_key: { userId: SCOPE, key: input.approvalId } },
    })
  } catch {
    return { ok: false, error: "Could not verify the approval.", status: 503 }
  }
  if (!row) return { ok: false, error: "Unknown or expired approval.", status: 403 }

  const record = row.data as ApprovalRecord
  if (record.userId !== input.userId) {
    return { ok: false, error: "This approval belongs to another user.", status: 403 }
  }
  if (record.toolName !== input.toolName) {
    return { ok: false, error: "Approval does not match this tool.", status: 403 }
  }
  if (record.argsHash !== hashApprovalArgs(input.args)) {
    return { ok: false, error: "Arguments changed after approval.", status: 403 }
  }
  if (typeof record.expiresAt !== "number" || record.expiresAt < Date.now()) {
    return { ok: false, error: "Approval has expired.", status: 403 }
  }
  if (record.usedAt) {
    return { ok: false, error: "Approval has already been used.", status: 403 }
  }

  try {
    const swapped = await prisma.moduleState.updateMany({
      where: { id: row.id, updatedAt: row.updatedAt, userId: SCOPE },
      data: {
        data: { ...record, usedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    })
    if (swapped.count !== 1) {
      return { ok: false, error: "Approval was already used. Retry the action.", status: 409 }
    }
  } catch {
    return { ok: false, error: "Could not consume the approval.", status: 503 }
  }
  return { ok: true }
}
