import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test"

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001"
const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPORT_DIR = path.resolve(HERE, "..", "reports")
export const SHOT_DIR = path.join(REPORT_DIR, "screenshots")

fs.mkdirSync(SHOT_DIR, { recursive: true })

export type Role = "admin" | "manager" | "employee"

export const ACCOUNTS: Record<Role, { email: string; password: string }> = {
  admin: { email: "asef.ahmed@northwind.co", password: "demo1234" },
  manager: { email: "manager@northwind.co", password: "demo1234" },
  employee: { email: "emp@northwind.co", password: "demo1234" },
}

type BrowserLog = {
  consoleErrors: string[]
  pageErrors: string[]
  failedRequests: string[]
}

/** Adds passive browser diagnostics to every test. Failures are asserted in
 *  individual specs so a single third-party asset hiccup doesn't hide real
 *  functional results. */
export const test = base.extend<{ browserLog: BrowserLog }>({
  browserLog: async ({ page }, use) => {
    const log: BrowserLog = { consoleErrors: [], pageErrors: [], failedRequests: [] }
    page.on("console", (msg) => {
      if (msg.type() === "error") log.consoleErrors.push(`${page.url()} :: ${msg.text()}`)
    })
    page.on("pageerror", (err) => log.pageErrors.push(`${page.url()} :: ${err.message}`))
    page.on("requestfailed", (req) => {
      const error = req.failure()?.errorText ?? "?"
      // Navigations legitimately cancel in-flight requests; those are not errors.
      if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(error)) return
      log.failedRequests.push(`${req.method()} ${req.url()} :: ${error}`)
    })
    await use(log)
  },
})
export { expect }

export function step(name: string) {
  console.log(`\n  ▶ ${name}`)
}

/** Logs in through the real rendered form (not by injecting cookies). */
export async function login(page: Page, role: Role): Promise<void> {
  const account = ACCOUNTS[role]
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
  await page.getByLabel("Work email").fill(account.email)
  await page.getByLabel("Password", { exact: true }).fill(account.password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 })
  await expect(page.getByRole("heading", { name: /welcome|overview|good/i }).first()).toBeVisible({ timeout: 20_000 }).catch(() => {})
}

export async function loginExpectFailure(page: Page, email: string, password: string): Promise<string> {
  await page.goto("/login")
  await page.getByLabel("Work email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  const alert = page.locator("[data-slot='alert-description']")
  await expect(alert).toBeVisible()
  return (await alert.first().innerText()).trim()
}

export async function logout(page: Page): Promise<void> {
  const signOut = page.getByRole("button", { name: "Sign out" }).first()
  if (await signOut.count()) {
    await signOut.click()
  } else {
    await page.getByRole("button", { name: "Account menu" }).click()
    await page.getByRole("menuitem", { name: /Sign out/ }).click()
  }
  await page.waitForURL(/\/login/, { timeout: 20_000 })
}

export async function shot(page: Page, name: string): Promise<string> {
  const safe = name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()
  const file = path.join(SHOT_DIR, `${safe}.png`)
  await page.screenshot({ path: file, fullPage: true, animations: "disabled" })
  return file
}

export async function apiVersion(request: APIRequestContext, key: string): Promise<string | null> {
  const res = await request.get(`/api/store/${key}`)
  return res.headers()["x-module-version"] ?? null
}

export async function apiGet(request: APIRequestContext, pathname: string): Promise<{ status: number; body: any; headers: Record<string, string> }> {
  // A dev server recompiling a route can reset an in-flight keep-alive socket.
  // Retry only transport failures, never HTTP error statuses.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await request.get(pathname)
      let body: any = null
      try { body = await res.json() } catch { body = await res.text().catch(() => null) }
      return { status: res.status(), body, headers: res.headers() }
    } catch (error) {
      if (attempt === 2) throw error
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  throw new Error("unreachable")
}

export async function apiWrite(
  request: APIRequestContext,
  key: string,
  body: unknown,
  version?: string | null,
  extraHeaders: Record<string, string> = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders }
  if (version) headers["If-Match"] = version
  const res = await request.put(`/api/store/${key}`, { headers, data: body })
  let parsed: any = null
  try { parsed = await res.json() } catch { parsed = await res.text().catch(() => null) }
  return { status: res.status(), body: parsed }
}

/** Guards against accidental mutation of real-looking data in a shared DB. */
export function testEmail(tag: string): string {
  return `qa-${tag}-${Date.now()}@example.test`
}

export async function expectNoHorizontalOverflow(page: Page): Promise<number> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, `${page.url()} horizontal overflow = ${overflow}px`).toBeLessThanOrEqual(2)
  return overflow
}
