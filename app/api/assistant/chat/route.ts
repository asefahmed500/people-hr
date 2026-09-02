import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { replyFor, type PeopleContext } from "@/lib/data/assistant"

const WORKSPACE_ID = "__workspace__"

const SYSTEM_PROMPT =
  "You are PeopleHR AI, a friendly HR assistant for an HR dashboard called PeopleHR. " +
  "Help with employees, leave, attendance, recruitment, projects, goals, payroll, " +
  "performance, onboarding, reports and company policies. Keep answers concise and practical. " +
  "If asked for exact numbers you don't know, say so rather than guessing."

/**
 * Role-scoped people context for the offline reply engine.
 * - Admins get workspace-wide numbers.
 * - Managers get only their department's slice.
 * - Everyone else gets no live context, so the canned replies never leak
 *   workspace data to employees (mirrors the store route's filterForRole).
 */
async function workspaceContext(opts: {
  role?: string | null
  department?: string | null
}): Promise<PeopleContext | undefined> {
  if (!opts.role || opts.role === "employee") return undefined

  const read = async (key: string): Promise<unknown> =>
    (await prisma.moduleState.findUnique({
      where: { userId_key: { userId: WORKSPACE_ID, key } },
    }))?.data

  const [emp, leave, rec, perf, payroll, goals] = await Promise.all([
    read("employees"),
    read("leave"),
    read("recruitment"),
    read("performance"),
    read("payroll"),
    read("goals"),
  ])

  const isAdmin = opts.role === "admin"
  const dept = opts.department

  const allEmployees = (emp as Array<{ status?: string; hiredDaysAgo?: number; department?: string; name?: string; id?: string }>) ?? []
  const employees = isAdmin ? allEmployees : allEmployees.filter((e) => e.department === dept)
  const requests =
    (leave as { requests?: Array<{ status?: string; startDate?: string; endDate?: string; employeeId?: string; employeeName?: string }> })?.requests ?? []
  const scopedRequests = isAdmin
    ? requests
    : requests.filter(
        (r) =>
          dept != null &&
          allEmployees.some(
            (e) => (e.name === r.employeeName || e.id === r.employeeId) && e.department === dept,
          ),
      )
  const candidates = isAdmin
    ? ((rec as { candidates?: unknown[] })?.candidates ?? [])
    : []
  const openings = isAdmin
    ? ((rec as { openings?: unknown[] })?.openings ?? [])
    : []
  const reviews = isAdmin
    ? (perf as { reviews?: Array<{ rating?: number; reviewedAt?: string; department?: string }> })?.reviews ?? []
    : (perf as { reviews?: Array<{ rating?: number; reviewedAt?: string; department?: string }> })?.reviews?.filter((r) => r.department === dept) ?? []
  const payments = isAdmin
    ? (payroll as { payments?: Array<{ status?: string }> })?.payments ?? []
    : []
  const objectives = isAdmin
    ? (goals as { objectives?: unknown[] })?.objectives ?? []
    : []

  const iso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
  const today = iso(new Date())
  const onLeaveToday = employees.filter((e) => e.status === "leave").length +
    scopedRequests.filter(
      (r) => r.status === "approved" && today >= r.startDate! && today <= r.endDate!,
    ).length
  const ratings = reviews.map((r) => r.rating ?? 0)

  return {
    headcount: employees.length,
    onLeaveToday,
    pendingLeave: scopedRequests.filter((r) => r.status === "pending").length,
    recentHires: employees.filter((e) => (e.hiredDaysAgo ?? 0) <= 30).length,
    openRoles: openings.length,
    applicants: candidates.length,
    reviewsSubmitted: reviews.filter((r) => r.reviewedAt).length,
    reviewsTotal: reviews.length,
    avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    pendingPayments: payments.filter((p) => p.status === "pending" || p.status === "failed").length,
    payRunDate: (payroll as { lastRun?: string | null })?.lastRun ?? null,
    activeObjectives: objectives.length,
  }
}

// Real LLM-backed chat when LLM_API_KEY is configured; otherwise falls back to
// the offline canned replies so the assistant always responds.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
  if (!prompt) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 })
  }
  if (prompt.length > 2000) {
    return NextResponse.json(
      { error: "That message is too long. Keep it under 2000 characters." },
      { status: 400 },
    )
  }

  // Sanitize client-supplied history: only user/assistant text survives, so a
  // crafted payload can't inject system/tool roles into the upstream request.
  const MAX_HISTORY = 8
  const MAX_ITEM_LENGTH = 1000
  const history = (Array.isArray(body?.messages) ? body.messages : [])
    .slice(-MAX_HISTORY)
    .map((m: unknown) => {
      const item = (m ?? {}) as { role?: unknown; content?: unknown }
      const role = item.role === "assistant" ? "assistant" : "user"
      const content = typeof item.content === "string" ? item.content.slice(0, MAX_ITEM_LENGTH) : ""
      return { role, content }
    })
    .filter((m: { role: string; content: string }) => m.content.length > 0)

  // LLM provider resolution. Any OpenAI-compatible endpoint works — including
  // Z.AI/GLM (https://api.z.ai/api/paas/v4, models "glm-5.3", "glm-5.3-flash").
  // Precedence: LLM_API_KEY, then Z.AI-family aliases (ZAI_API_KEY /
  // ZHIPU_API_KEY / GLM_API_KEY). When only an alias is present the defaults
  // follow Z.AI's endpoint + flagship model so a bare key "just works".
  const zaiKey =
    process.env.ZAI_API_KEY || process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY || ""
  const key = process.env.LLM_API_KEY || zaiKey
  const usingZaiAlias = !process.env.LLM_API_KEY && !!zaiKey
  if (key) {
    const base = process.env.LLM_BASE_URL || (usingZaiAlias ? "https://api.z.ai/api/paas/v4" : "https://api.openai.com/v1")
    const model = process.env.LLM_MODEL || (usingZaiAlias ? "glm-5.3" : "gpt-4o-mini")
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: prompt },
          ],
          max_tokens: 400,
        }),
        // Don't let a hung upstream pin the chat route forever.
        signal: AbortSignal.timeout(25_000),
      })
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as {
          choices?: { message?: { content?: string } }[]
        } | null
        const reply = data?.choices?.[0]?.message?.content
        if (reply) {
          return NextResponse.json({ reply: reply.trim() })
        }
      }
    } catch {
      // Fall through to offline replies if the LLM call fails or times out.
    }
  }

  const ctx = await workspaceContext({
    role: session.user.role,
    department: session.user.department,
  }).catch(() => undefined)
  return NextResponse.json({ reply: replyFor(prompt, ctx) })
}
