import { test, expect, apiGet, apiVersion, apiWrite, shot, step, testEmail } from "./helpers"

const admin = "tests/reports/auth/admin.json"
const manager = "tests/reports/auth/manager.json"
const employee = "tests/reports/auth/employee.json"

test.describe("API contracts & error handling", () => {
  test.use({ storageState: admin })

  test("store API: validation, concurrency, unknown keys and computed analytics", async ({ page }) => {
    const version = await apiVersion(page.request, "employees")
    expect(version).toBeTruthy()
    const rows = (await apiGet(page.request, "/api/store/employees")).body as any[]

    const badSchema = await apiWrite(page.request, "employees", [{ name: "incomplete" }], version)
    expect(badSchema.status, "invalid employee payload is 400").toBe(400)

    const email = testEmail("dup")
    const row = {
      id: `qa-dup-${Date.now()}`, name: "QA Duplicate", email, initials: "QD",
      department: "Engineering", role: "Engineer", location: "Remote", status: "active", hiredDaysAgo: 0,
    }
    const created = await apiWrite(page.request, "employees", [...rows, row], version)
    expect(created.status).toBe(200)
    const dup = await apiWrite(page.request, "employees", [...rows, row, { ...row, id: "qa-dup-2" }], created.body?.version ?? null)
    expect([400, 409], "duplicate email or stale version rejected").toContain(dup.status)

    const conflict = await apiWrite(page.request, "employees", rows, "0")
    expect(conflict.status, "stale If-Match is 409").toBe(409)

    const unknown = await page.request.get("/api/store/definitely-not-a-module")
    expect(unknown.status()).toBe(404)

    const analytics = await apiGet(page.request, "/api/store/analytics")
    expect(analytics.status).toBe(200)
    expect(typeof analytics.body.headcount).toBe("number")
    const analyticsWrite = await page.request.put("/api/store/analytics", { data: analytics.body })
    expect(analyticsWrite.status(), "analytics is read-only").toBe(400)

    // cleanup
    const v2 = await apiVersion(page.request, "employees")
    const current = (await apiGet(page.request, "/api/store/employees")).body as any[]
    await apiWrite(page.request, "employees", current.filter((e) => e.id !== row.id), v2)
    step(`validation/concurrency statuses: ${badSchema.status}/${dup.status}/${conflict.status}/${unknown.status()}/${analyticsWrite.status()}`)
  })

  test("notifications CRUD returns 201/200/404 and stays per-user", async ({ page }) => {
    const created = await page.request.post("/api/notifications", {
      data: { title: "QA security notification", description: "test", href: "/dashboard" },
    })
    expect(created.status(), "notification create is 201").toBe(201)
    const item = await created.json()

    const patched = await page.request.patch(`/api/notifications/${item.id}`, { data: { read: true } })
    expect(patched.status()).toBe(200)
    const list = (await apiGet(page.request, "/api/notifications")).body
    expect(list.some((n: any) => n.id === item.id && n.read)).toBe(true)

    const removed = await page.request.delete(`/api/notifications/${item.id}`)
    expect(removed.status()).toBe(200)
    const after = await page.request.get(`/api/notifications/${item.id}`)
    expect([404, 405]).toContain(after.status())

    const badHref = await page.request.post("/api/notifications", {
      data: { title: "x", href: "//evil.test" },
    })
    expect(badHref.status(), "open-redirect href rejected").toBe(400)
  })

  test("catch-all API returns JSON 404, billing is honest without keys", async ({ page }) => {
    const missing = await page.request.get("/api/this-route-does-not-exist")
    expect(missing.status()).toBe(404)
    expect(await missing.json()).toHaveProperty("error")
    const billing = (await apiGet(page.request, "/api/billing")).body
    expect(billing.configured).toBe(false)
  })

  test("Auth.js rejects CSRF-less signout", async ({ page }) => {
    const res = await page.request.post("/api/auth/signout", {
      form: { callbackUrl: "/login" },
      maxRedirects: 0,
    })
    // Auth.js answers a failed CSRF check with a redirect to an error page.
    expect([302, 400, 403]).toContain(res.status())
    expect(res.headers()["location"] ?? "").toMatch(/error|csrf|signin/i)
    const stillSignedIn = await (await page.request.get("/api/auth/session")).json()
    expect(stillSignedIn?.user?.role, "CSRF-less signout did not destroy the session").toBe("admin")
  })
})

test.describe("Authorization boundary", () => {
  test.use({ storageState: manager })

  test("manager is blocked from admin APIs and admin-only JSON stores", async ({ page }) => {
    for (const path of ["/api/jobs", "/api/users", "/api/billing", "/api/reports/run-due"]) {
      expect((await page.request.get(path)).status(), `manager GET ${path}`).toBe(403)
    }
    expect((await page.request.post("/api/payroll/run", { data: {} })).status()).toBe(403)
    expect((await page.request.put("/api/store/payroll", { data: { payments: [], lastRun: null } })).status()).toBe(403)
    const org = (await apiGet(page.request, "/api/store/organization")).body
    expect(org.departments ?? []).toHaveLength(0)
  })
})

test.describe("Employee data isolation", () => {
  test.use({ storageState: employee })

  test("employee cannot escalate or read other users' data", async ({ page }) => {
    const session = (await (await page.request.get("/api/auth/session")).json()).user
    expect(session.role).toBe("employee")

    expect((await page.request.patch("/api/users/" + session.id, { data: { role: "admin" } })).status()).toBe(403)
    expect((await page.request.get("/api/jobs")).status()).toBe(403)
    expect((await page.request.put("/api/store/payroll", { data: { payments: [], lastRun: null } })).status()).toBe(403)
    expect((await page.request.put("/api/store/reports", { data: { templates: [], scheduled: [], recent: [] } })).status()).toBe(403)

    const employees = (await apiGet(page.request, "/api/store/employees")).body as any[]
    expect(employees.length, "employee sees only own directory row").toBeLessThanOrEqual(1)

    const otherNotifications = await page.request.patch("/api/notifications/not-a-real-id", { data: { read: true } })
    expect(otherNotifications.status(), "foreign notification id rejected").toBe(404)

    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find((c) => c.name === "authjs.session-token")
    expect(sessionCookie?.httpOnly, "session cookie is httpOnly").toBe(true)
    expect(sessionCookie?.sameSite, "session cookie is Lax").toBe("Lax")
  })
})

test.describe("Browser-level security checks", () => {
  test.use({ storageState: admin })

  test("stored XSS payload in an announcement is not executed", async ({ page }) => {
    const marker = "qa-xss-" + Date.now()
    const payload = `<img src=x onerror="window.__QA_XSS__='${marker}'">`
    const before = (await apiGet(page.request, "/api/store/announcements")).body
    const version = await apiVersion(page.request, "announcements")
    const announcement = {
      id: `qa-xss-${Date.now()}`, title: "QA XSS probe", body: payload, author: "QA",
      pinned: false, createdAt: Date.now(),
    }
    expect((await apiWrite(page.request, "announcements", {
      ...before, announcements: [...before.announcements, announcement],
    }, version)).status).toBe(200)

    await page.goto("/announcements")
    await expect(page.getByText("QA XSS probe")).toBeVisible()
    await shot(page, "security-01-xss-announcement")
    expect(await page.evaluate(() => (window as any).__QA_XSS__ ?? null), "no inline handler fired").toBeNull()

    const v2 = await apiVersion(page.request, "announcements")
    const current = (await apiGet(page.request, "/api/store/announcements")).body
    await apiWrite(page.request, "announcements", {
      ...current, announcements: current.announcements.filter((a: any) => a.id !== announcement.id),
    }, v2)
    step("stored XSS payload rendered inert")
  })
})
