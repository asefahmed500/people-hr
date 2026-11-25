import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, type FullConfig } from "@playwright/test"
import { PrismaClient } from "@prisma/client"

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001"
const HERE = path.dirname(fileURLToPath(import.meta.url))
const AUTH_DIR = path.resolve(HERE, "..", "reports", "auth")

const ACCOUNTS = [
  { role: "admin", email: "asef.ahmed@northwind.co" },
  { role: "manager", email: "manager@northwind.co" },
  { role: "employee", email: "emp@northwind.co" },
] as const

/**
 * Creates one browser storage state per role. Using the Auth.js endpoint here
 * (rather than the UI) keeps the 2FA pre-check rate limit available for the
 * authentication spec, which deliberately exercises the real login form.
 */
export default async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  // Test isolation only: clear the reserved rate-limit/login-lock scopes so a
  // long QA session doesn't get 429s from earlier runs. Never do this against
  // a deployed environment.
  if (process.env.E2E_RESET_LIMITS !== "false") {
    const prisma = new PrismaClient()
    try {
      await prisma.moduleState.deleteMany({
        where: { userId: { in: ["__ratelimit__", "__loginlock__"] } },
      })
      // The demo employee's annual leave is consumed by repeated approval
      // tests; restore it so the leave workflow is repeatable.
      const leave = await prisma.moduleState.findFirst({
        where: { userId: "__workspace__", key: "leave" },
      })
      const employee = await prisma.user.findUnique({
        where: { email: "emp@northwind.co" },
        select: { id: true },
      })
      if (leave?.data && employee && typeof leave.data === "object" && !Array.isArray(leave.data)) {
        const doc = leave.data as Record<string, any>
        const balances = { ...(doc.balances ?? {}) }
        if (balances[employee.id]?.annual) {
          balances[employee.id] = {
            ...balances[employee.id],
            annual: { ...balances[employee.id].annual, used: 0 },
          }
          await prisma.moduleState.update({
            where: { id: leave.id },
            data: { data: { ...doc, balances } as object },
          })
        }
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  const browser = await chromium.launch({ headless: true })
  try {
    for (const account of ACCOUNTS) {
      const context = await browser.newContext({ baseURL: BASE_URL })
      const csrfRes = await context.request.get("/api/auth/csrf")
      if (!csrfRes.ok()) throw new Error(`csrf failed for ${account.role}: ${csrfRes.status()}`)
      const { csrfToken } = await csrfRes.json()

      const callback = await context.request.post("/api/auth/callback/credentials", {
        form: {
          csrfToken,
          email: account.email,
          password: "demo1234",
          token: "undefined",
          callbackUrl: `${BASE_URL}/login`,
          json: "true",
        },
        maxRedirects: 0,
      })
      if (callback.status() >= 400) throw new Error(`login failed for ${account.role}: ${callback.status()}`)

      const session = await context.request.get("/api/auth/session")
      const body = await session.json()
      if (body?.user?.role !== account.role) {
        throw new Error(`wrong role in ${account.role} fixture: ${body?.user?.role}`)
      }
      await context.storageState({ path: path.join(AUTH_DIR, `${account.role}.json`) })
      await context.close()
    }
  } finally {
    await browser.close()
  }
}
