import { test, expect, apiGet, apiVersion, apiWrite, shot, step, testEmail } from "./helpers"

const adminState = "tests/reports/auth/admin.json"
const employeeState = "tests/reports/auth/employee.json"

const iso = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

test.describe("Employees CRUD (admin)", () => {
  test.use({ storageState: adminState })

  test("create → search → read → update → refresh → deactivate → reactivate, with API + DB-backed store verification", async ({ page }) => {
    const email = testEmail("employees")
    // The form rejects digits in names (letters, spaces and ' - . only).
    const name = `QA Probe Employee`
    await page.goto("/employees")
    await expect(page.getByRole("button", { name: "Add employee" })).toBeVisible()
    await shot(page, "crud-employees-01-list")

    await page.getByRole("button", { name: "Add employee" }).click()
    const dialog = page.getByRole("dialog", { name: "Add employee" })
    await expect(dialog).toBeVisible()

    // Required-field validation before any data is entered.
    await dialog.getByRole("button", { name: "Add employee" }).click()
    await expect(dialog).toContainText(/required|enter|must|valid/i)
    await shot(page, "crud-employees-02-validation")

    await dialog.getByLabel(/Full name/).fill(name)
    await dialog.getByLabel(/^Email/).fill(email)
    await dialog.getByLabel(/^Role/).fill("QA Engineer")
    await dialog.getByLabel(/Department/).selectOption("Engineering")
    await dialog.getByLabel(/^Location/).fill("Remote - QA")
    await shot(page, "crud-employees-03-form")
    await dialog.getByRole("button", { name: "Add employee" }).click()
    await expect(dialog, "dialog closes after submit").toBeHidden()

    await expect.poll(async () => {
      const res = await apiGet(page.request, "/api/store/employees")
      return (res.body as any[]).some((e) => e.email === email)
    }, "employee persisted through the API").toBe(true)
    const created = ((await apiGet(page.request, "/api/store/employees")).body as any[]).find((e) => e.email === email)!
    step(`created employee id=${created.id}`)

    const rowActions = () => page.locator('div[role="button"]:visible').filter({ hasText: name })
      .locator('button[aria-label="Row actions"]').first()
    const search = page.getByRole("textbox", { name: /Search by name/i }).first()
    await search.fill(name)
    await expect(page.getByText(name).first()).toBeVisible()
    await shot(page, "crud-employees-04-created-and-searched")

    // UPDATE via row actions
    await rowActions().click()
    await page.getByRole("menuitem", { name: "Edit" }).click()
    const editDialog = page.getByRole("dialog", { name: "Edit employee" })
    await expect(editDialog).toBeVisible()
    await editDialog.getByLabel(/^Location/).fill("Austin, TX")
    await editDialog.getByRole("button", { name: "Save changes" }).click()
    await expect(editDialog).toBeHidden()
    await expect.poll(async () => {
      const rows = (await apiGet(page.request, "/api/store/employees")).body as any[]
      return rows.find((e) => e.id === created.id)?.location
    }).toBe("Austin, TX")
    await page.reload()
    await expect(page.getByRole("textbox", { name: /Search by name/i }).first()).toBeVisible()
    await page.getByRole("textbox", { name: /Search by name/i }).first().fill(name)
    await expect(page.getByText("Austin, TX").first()).toBeVisible()

    // READ profile sheet
    await rowActions().click()
    await page.getByRole("menuitem", { name: "View profile" }).click()
    await expect(page.getByRole("dialog")).toContainText(name)
    await shot(page, "crud-employees-05-profile")
    await page.keyboard.press("Escape")

    // EXPORT
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export" }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
    step(`CSV export: ${download.suggestedFilename()}`)

    // DEACTIVATE then REACTIVATE (cancel path is exercised by the confirm dialog)
    await rowActions().click()
    await page.getByRole("menuitem", { name: "Deactivate" }).click()
    const confirm = page.getByRole("alertdialog")
    await expect(confirm).toContainText(/Deactivate/i)
    await shot(page, "crud-employees-06-deactivate-confirm")
    await confirm.getByRole("button", { name: "Cancel" }).click()
    await expect(confirm).toBeHidden()
    await expect.poll(async () => {
      const rows = (await apiGet(page.request, "/api/store/employees")).body as any[]
      return rows.find((e) => e.id === created.id)?.status
    }).toBe("active")

    await rowActions().click()
    await page.getByRole("menuitem", { name: "Deactivate" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Deactivate" }).click()
    await expect.poll(async () => {
      const rows = (await apiGet(page.request, "/api/store/employees")).body as any[]
      return rows.find((e) => e.id === created.id)?.status
    }).toBe("inactive")
    await rowActions().click()
    await page.getByRole("menuitem", { name: "Reactivate" }).click()
    await expect.poll(async () => {
      const rows = (await apiGet(page.request, "/api/store/employees")).body as any[]
      return rows.find((e) => e.id === created.id)?.status
    }).toBe("active")

    // Test-data cleanup through the approved store API.
    const version = await apiVersion(page.request, "employees")
    const rows = (await apiGet(page.request, "/api/store/employees")).body as any[]
    const cleaned = await apiWrite(page.request, "employees", rows.filter((e) => e.id !== created.id), version)
    expect(cleaned.status).toBe(200)
  })
})

test.describe("Leave request & approval workflow", () => {
  test.use({ storageState: employeeState })

  test("employee submits a leave request through the UI and it reaches the store", async ({ page }) => {
    // Remove leftovers from interrupted runs: the overlap guard would reject
    // the same fixed date window on every subsequent execution.
    const staleVersion = await apiVersion(page.request, "leave")
    const staleBody = (await apiGet(page.request, "/api/store/leave")).body
    const session = (await (await page.request.get("/api/auth/session")).json()).user
    const hasStale = staleBody.requests.some((r: any) => r.reason === "QA automation leave request")
    const used = staleBody.balances?.[session.id]?.annual?.used ?? 0
    if (hasStale || used > 0) {
      const balances = { ...staleBody.balances }
      if (balances[session.id]?.annual) {
        balances[session.id] = { ...balances[session.id], annual: { ...balances[session.id].annual, used: 0 } }
      }
      await apiWrite(page.request, "leave", {
        ...staleBody,
        requests: staleBody.requests.filter((r: any) => r.reason !== "QA automation leave request"),
        balances,
      }, staleVersion)
    }
    await page.goto("/leave")
    await expect(page.getByRole("button", { name: "Request leave" })).toBeVisible()
    await page.getByRole("button", { name: "Request leave" }).click()
    const dialog = page.getByRole("dialog", { name: "Request leave" })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "Submit request" }).click()
    await expect(dialog).toContainText(/add a brief reason|pick a (start|end) date|must be/i)
    await shot(page, "crud-leave-01-validation")

    await dialog.getByLabel(/Type/).selectOption("vac")
    await dialog.getByLabel(/^Start/).fill(iso(10))
    await dialog.getByLabel(/^End/).fill(iso(12))
    await dialog.getByLabel(/Reason/).fill("QA automation leave request")
    await shot(page, "crud-leave-02-form")
    await dialog.getByRole("button", { name: "Submit request" }).click()
    await expect(dialog).toBeHidden()

    await expect.poll(async () => {
      const body = (await apiGet(page.request, "/api/store/leave")).body
      return (body?.requests ?? []).some((r: any) => r.reason === "QA automation leave request")
    }, "leave request persisted").toBe(true)
    await shot(page, "crud-leave-03-employee-pending")

    step(`employee=${session.email} id=${session.id}`)
  })
})

test.describe("Leave approval (admin) + cross-module side effects", () => {
  test.use({ storageState: adminState })

  test("admin approves the pending request and the balance is deducted", async ({ page }) => {
    await page.goto("/leave")
    await expect(page.locator("body")).toContainText(/Leave/i)

    const before = (await apiGet(page.request, "/api/store/leave")).body
    const pending = (before.requests as any[]).find((r) => r.reason === "QA automation leave request")
    expect(pending, "seed request from employee test exists").toBeTruthy()
    expect(pending.status).toBe("pending")

    const approve = page.getByRole("button", { name: `Approve ${pending.employeeName}` }).first()
    await expect(approve).toBeVisible()
    await shot(page, "crud-leave-04-admin-pending")
    await approve.click()
    await expect.poll(async () => {
      const body = (await apiGet(page.request, "/api/store/leave")).body
      return (body.requests as any[]).find((r: any) => r.id === pending.id)?.status
    }).toBe("approved")

    const after = (await apiGet(page.request, "/api/store/leave")).body
    const usedBefore = before.balances[pending.employeeId]?.annual?.used ?? 0
    const usedAfter = after.balances[pending.employeeId]?.annual?.used ?? 0
    step(`annual used ${usedBefore} → ${usedAfter} (${pending.days} days approved)`)
    expect(usedAfter - usedBefore).toBeCloseTo(pending.days, 1)
    await shot(page, "crud-leave-05-approved")

    // Cleanup the request; balances are intentionally left deducted (the
    // application has no un-approve path) and are test-only data.
    const version = await apiVersion(page.request, "leave")
    const cleaned = await apiWrite(page.request, "leave", {
      ...after,
      requests: after.requests.filter((r: any) => r.id !== pending.id),
    }, version)
    expect(cleaned.status).toBe(200)
  })
})
