import { test, expect, apiGet, apiVersion, apiWrite, shot, step } from "./helpers"

const admin = "tests/reports/auth/admin.json"

test.describe("AI, notifications, profile and activity (admin)", () => {
  test.use({ storageState: admin })

  test("AI assistant sends a prompt through the real API and renders a reply", async ({ page }) => {
    await page.goto("/assistant")
    const input = page.getByRole("textbox", { name: "Message" })
    await expect(input).toBeVisible()
    const responseWait = page.waitForResponse((r) => r.url().includes("/api/assistant/chat") && r.request().method() === "POST")
    await input.fill("Summarize this month's hiring")
    await page.getByRole("button", { name: "Send message" }).click()
    const res = await responseWait
    expect(res.status(), "assistant API responds 200").toBe(200)
    const payload = await res.json()
    expect(typeof payload.reply, "AI reply is a string").toBe("string")
    expect(payload.reply.length).toBeGreaterThan(0)
    await expect(page.getByText(payload.reply).first()).toBeVisible({ timeout: 20_000 })
    await shot(page, "feature-01-assistant-reply")
    step(`assistant reply length=${payload.reply.length} (LLM configured: ${payload.reply.includes("LLM") ? "no" : "unknown"})`)
  })

  test("notification bell loads, marks all read and reflects the store", async ({ page }) => {
    await page.request.post("/api/notifications", {
      data: { title: "QA bell notification", description: "bell test", href: "/activity" },
    })
    await page.goto("/dashboard")
    const bell = page.getByRole("button", { name: /Notifications/ }).first()
    await bell.click()
    await expect(page.getByText("QA bell notification").first()).toBeVisible()
    await shot(page, "feature-02-notifications-open")
    const markAll = page.getByRole("button", { name: "Mark all read" })
    if (await markAll.count()) await markAll.click()
    await expect.poll(async () => {
      const items = (await apiGet(page.request, "/api/notifications")).body as any[]
      return items.filter((n) => n.title === "QA bell notification").every((n) => n.read)
    }).toBe(true)
    step("bell mark-all-read persisted")
  })

  test("profile edit saves through /api/user/profile and survives refresh", async ({ page }) => {
    await page.goto("/settings")
    await expect(page.getByRole("tab", { name: "Profile" })).toBeVisible()
    const title = page.getByText("Job title", { exact: true }).locator("xpath=following-sibling::div/input").first()
    const original = await title.inputValue()
    const next = `${original || "People Lead"} QA`
    // The form also saves name/email; keep the real identity values so the
    // test never overwrites the account with placeholder settings defaults.
    const session = (await (await page.request.get("/api/auth/session")).json()).user
    await page.getByText("Full name", { exact: true }).locator("xpath=following-sibling::div/input").first().fill(session.name)
    await page.getByText("Email", { exact: true }).locator("xpath=following-sibling::div/input").first().fill(session.email)
    await title.fill(next)
    await page.getByRole("button", { name: "Save changes" }).click()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/settings")).body?.personal?.jobTitle)
      .toBe(next)
    await page.reload()
    await expect(page.getByText("Job title", { exact: true }).locator("xpath=following-sibling::div/input").first()).toHaveValue(next)
    await shot(page, "feature-03-profile-saved")
    // restore
    await page.getByText("Job title", { exact: true }).locator("xpath=following-sibling::div/input").first().fill(original)
    await page.getByRole("button", { name: "Save changes" }).click()
    step("profile update + restore verified")
  })

  test("activity page filters by module and event count", async ({ page }) => {
    await page.goto("/activity")
    const status = page.getByText(/Showing \d+ of \d+ events/)
    await expect(status).toBeVisible()
    const moduleFilter = page.getByLabel("Filter by module")
    await moduleFilter.selectOption({ index: 1 })
    await expect(status).toBeVisible()
    await page.getByLabel("Number of events to show").selectOption("10")
    await expect(status).toBeVisible()
    await shot(page, "feature-04-activity-filtered")
    step("activity filters respond")
  })

  test("performance: start a review and persist it", async ({ page }) => {
    await page.goto("/performance")
    await page.getByRole("button", { name: "Start review" }).click()
    const dialog = page.getByRole("dialog", { name: "Start review" })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/Employee/).selectOption({ index: 1 })
    await dialog.getByLabel(/Rating/).selectOption("4")
    await dialog.getByLabel(/Review period/).selectOption({ index: 1 })
    await shot(page, "feature-05-performance-review-form")
    await dialog.getByRole("button", { name: "Submit review" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/performance")).body.reviews.length)
      .toBeGreaterThan(0)
    step("performance review persisted")
  })
})

test.describe("Hiring lifecycle (admin)", () => {
  test.use({ storageState: admin })

  test("candidate moved to Hired creates employee + leave balance + onboarding tasks", async ({ page }) => {
    const name = "QA Lifecycle Hire"
    await page.goto("/recruitment")
    await expect(page.getByRole("button", { name: "Add candidate" })).toBeVisible()
    await page.getByRole("button", { name: "Add candidate" }).click()
    const dialog = page.getByRole("dialog", { name: "Add candidate" })
    await dialog.getByLabel(/Full name/).fill(name)
    await dialog.getByLabel(/Role applied for/).fill("QA Engineer")
    await dialog.getByLabel(/Department/).selectOption("Engineering")
    await dialog.getByLabel(/Email/).fill(`qa-hire-${Date.now()}@example.test`)
    await dialog.getByLabel(/Agreed salary/).fill("4200")
    await shot(page, "feature-06-recruitment-candidate")
    await dialog.getByRole("button", { name: "Add candidate" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/recruitment")).body.candidates as any[])
      .some((c: any) => c.name === name)).toBe(true)

    await page.locator(`[aria-label="Move ${name}"]`).click()
    await page.getByRole("menuitem", { name: /Move to Hired/i }).click()
    await shot(page, "feature-07-lifecycle-hired")

    await expect.poll(async () => {
      const rec = (await apiGet(page.request, "/api/store/recruitment")).body
      return (rec.candidates as any[]).find((c: any) => c.name === name)?.stage
    }).toBe("hired")
    await expect.poll(async () => (await apiGet(page.request, "/api/store/employees")).body as any[])
      .toEqual(expect.arrayContaining([expect.objectContaining({ name })]))
    const employees = (await apiGet(page.request, "/api/store/employees")).body as any[]
    const hired = employees.find((e: any) => e.name === name)!
    const leave = (await apiGet(page.request, "/api/store/leave")).body
    expect(leave.balances[hired.id], "leave balance seeded for new hire").toBeTruthy()
    const onboarding = (await apiGet(page.request, "/api/store/onboarding")).body.tasks as any[]
    expect(onboarding.filter((t: any) => t.employeeId === hired.id).length, "8 onboarding tasks").toBe(8)
    step(`hire lifecycle created employee ${hired.id} with 8 onboarding tasks`)

    // Cleanup the generated employee, leave balance, onboarding tasks and candidate.
    const cleanup = async (key: string, predicate: (row: any) => boolean) => {
      const v = await apiVersion(page.request, key)
      const body = (await apiGet(page.request, `/api/store/${key}`)).body
      if (Array.isArray(body)) {
        await apiWrite(page.request, key, body.filter((row: any) => !predicate(row)), v)
      } else {
        const cloned: any = { ...body }
        for (const k of Object.keys(cloned)) {
          if (Array.isArray(cloned[k])) cloned[k] = cloned[k].filter((row: any) => !predicate(row))
          if (cloned[k] && typeof cloned[k] === "object" && !Array.isArray(cloned[k]) && k === "balances") {
            delete cloned[k][hired.id]
          }
        }
        await apiWrite(page.request, key, cloned, v)
      }
    }
    await cleanup("employees", (r: any) => r.id === hired.id)
    await cleanup("recruitment", (r: any) => r.name === name)
    await cleanup("onboarding", (r: any) => r.employeeId === hired.id)
    await cleanup("leave", (r: any) => false)
  })
})
