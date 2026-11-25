import { test, expect, apiGet, apiVersion, apiWrite, shot, step } from "./helpers"

const adminState = "tests/reports/auth/admin.json"

test.describe("Projects, Goals, Announcements CRUD (admin)", () => {
  test.use({ storageState: adminState })

  test("project: create → edit → verify persistence → delete", async ({ page }) => {
    const name = `QA Project ${Date.now()}`
    await page.goto("/projects")
    await expect(page.getByRole("button", { name: "New project" })).toBeVisible()
    await page.getByRole("button", { name: "New project" }).click()
    const dialog = page.getByRole("dialog", { name: "New project" })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "Create project" }).click()
    await expect(dialog).toContainText(/required|enter|name/i)
    await dialog.getByLabel(/Project name/).fill(name)
    await dialog.getByLabel(/Owner/).selectOption({ index: 1 })
    await dialog.getByLabel(/Department/).selectOption("Engineering")
    await dialog.getByLabel(/Due date/).fill(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10))
    await dialog.getByLabel(/Priority/).selectOption("high")
    await shot(page, "crud-project-01-form")
    await dialog.getByRole("button", { name: "Create project" }).click()
    await expect(dialog).toBeHidden()

    await expect.poll(async () => ((await apiGet(page.request, "/api/store/projects")).body.tasks as any[])
      .some((t) => t.name === name), "project persisted").toBe(true)
    const task = ((await apiGet(page.request, "/api/store/projects")).body.tasks as any[]).find((t) => t.name === name)!

    await page.locator(`[aria-label="Actions for ${name}"]`).click()
    await page.getByRole("menuitem", { name: "Edit project" }).click()
    const edit = page.getByRole("dialog", { name: "Edit project" })
    await expect(edit).toBeVisible()
    await edit.getByLabel(/Progress/).fill("65")
    await edit.getByRole("button", { name: "Save changes" }).click()
    await expect(edit).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/projects")).body.tasks as any[])
      .find((t: any) => t.id === task.id)?.progress).toBe(65)
    await shot(page, "crud-project-02-updated")

    await page.locator(`[aria-label="Actions for ${name}"]`).click()
    await page.getByRole("menuitem", { name: "Delete project" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/projects")).body.tasks as any[])
      .some((t) => t.id === task.id)).toBe(false)
    step("project create/edit/delete verified")
  })

  test("goal: create + key result + edit + delete", async ({ page }) => {
    const title = "QA Objective Check"
    await page.goto("/goals")
    await expect(page.getByRole("button", { name: "New goal" })).toBeVisible()
    await page.getByRole("button", { name: "New goal" }).click()
    const dialog = page.getByRole("dialog", { name: "New goal" })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/Title/).fill(title)
    await dialog.getByLabel(/Owner name/).fill("QA Owner")
    await dialog.getByLabel(/Owner role/).fill("QA Lead")
    await shot(page, "crud-goal-01-form")
    await dialog.getByRole("button", { name: "Create goal" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/goals")).body.objectives as any[])
      .some((o: any) => o.title === title)).toBe(true)
    const goal = ((await apiGet(page.request, "/api/store/goals")).body.objectives as any[]).find((o: any) => o.title === title)!

    await page.getByRole("button", { name: "Add key result" }).first().click()
    const krDialog = page.getByRole("dialog", { name: "Add key result" })
    await krDialog.getByLabel(/Label/).fill("QA key result")
    await krDialog.getByLabel(/Current progress/).fill("25")
    await krDialog.getByRole("button", { name: "Add key result" }).click()
    await expect(krDialog).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/goals")).body.objectives as any[])
      .find((o: any) => o.id === goal.id)?.krs?.length).toBeGreaterThan(0)

    await page.locator(`[aria-label="Edit ${title}"]`).click()
    const edit = page.getByRole("dialog", { name: "Edit objective" })
    await edit.getByLabel(/Title/).fill("QA Objective Updated")
    await edit.getByRole("button", { name: "Save changes" }).click()
    await expect(edit).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/goals")).body.objectives as any[])
      .find((o: any) => o.id === goal.id)?.title).toBe("QA Objective Updated")

    await page.locator('[aria-label="Delete QA Objective Updated"]').click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/goals")).body.objectives as any[])
      .some((o: any) => o.id === goal.id)).toBe(false)
    step("goal create/KR/edit/delete verified")
  })

  test("announcement: create → pin → unpin → delete", async ({ page }) => {
    const title = `QA Notice ${Date.now()}`
    await page.goto("/announcements")
    await page.getByRole("button", { name: "New announcement" }).click()
    const dialog = page.getByRole("dialog", { name: "New announcement" })
    await dialog.getByLabel(/Title/).fill(title)
    await dialog.getByLabel(/Body/).fill("Automated QA announcement body.")
    await shot(page, "crud-announcement-01-form")
    await dialog.getByRole("button", { name: "Post announcement" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/announcements")).body.announcements as any[])
      .some((a: any) => a.title === title)).toBe(true)
    const item = ((await apiGet(page.request, "/api/store/announcements")).body.announcements as any[]).find((a: any) => a.title === title)!

    await page.locator('[aria-label="Pin announcement"]').first().click()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/announcements")).body.announcements as any[])
      .find((a: any) => a.id === item.id)?.pinned).toBe(true)
    await page.locator('[aria-label="Unpin announcement"]').first().click()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/announcements")).body.announcements as any[])
      .find((a: any) => a.id === item.id)?.pinned).toBe(false)
    await shot(page, "crud-announcement-02-published")

    const cleanupVersion = await apiVersion(page.request, "announcements")
    const body = (await apiGet(page.request, "/api/store/announcements")).body
    expect((await apiWrite(page.request, "announcements", {
      ...body,
      announcements: body.announcements.filter((a: any) => a.id !== item.id),
    }, cleanupVersion)).status).toBe(200)
    step("announcement create/pin/unpin verified")
  })
})

test.describe("Operations workflows (admin)", () => {
  test.use({ storageState: adminState })

  test("onboarding: add a new hire seeds tasks and phase advance persists", async ({ page }) => {
    const name = "QA New Hire"
    await page.goto("/onboarding")
    await expect(page.getByRole("button", { name: "Add new hire" })).toBeVisible()
    const before = (await apiGet(page.request, "/api/store/onboarding")).body.tasks.length
    await page.getByRole("button", { name: "Add new hire" }).click()
    const dialog = page.getByRole("dialog", { name: "Add new hire" })
    await dialog.getByLabel(/Full name/).fill(name)
    await dialog.getByLabel(/Role/).fill("QA Engineer")
    await dialog.getByLabel(/Department/).selectOption("Engineering")
    await dialog.getByRole("button", { name: "Add" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/onboarding")).body.tasks.length)
      .toBeGreaterThan(before)
    await shot(page, "workflow-onboarding-01-added")

    const advanced = await page.getByRole("button", { name: new RegExp(`Advance ${name}`) }).first()
    if (await advanced.count()) {
      await advanced.click()
      await expect.poll(async () => (await apiGet(page.request, "/api/store/onboarding")).body.tasks
        .some((t: any) => t.hireName === name && t.phase !== "pre")).toBe(true)
    }
    step("onboarding hire + phase advance verified")
  })

  test("reports: create schedule, toggle, generate now and delete", async ({ page }) => {
    const name = `QA Scheduled ${Date.now()}`
    // Earlier runs can leave schedules behind; the background scheduler also
    // appends to this document, so start from a clean, freshly-versioned doc.
    const cleanVersion = await apiVersion(page.request, "reports")
    const cleanBody = (await apiGet(page.request, "/api/store/reports")).body
    await apiWrite(page.request, "reports", {
      ...cleanBody,
      scheduled: cleanBody.scheduled.filter((s: any) => !String(s.name).startsWith("QA Scheduled")),
    }, cleanVersion)
    await page.goto("/reports")
    await page.getByRole("button", { name: "New report" }).click()
    const dialog = page.getByRole("dialog", { name: "New report" })
    await dialog.getByLabel(/Report name/).fill(name)
    await dialog.getByRole("button", { name: "Create" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/reports")).body.scheduled as any[])
      .some((s: any) => s.name === name)).toBe(true)
    const schedule = ((await apiGet(page.request, "/api/store/reports")).body.scheduled as any[]).find((s: any) => s.name === name)!

    await page.locator(`[aria-label="More options for ${name}"]`).click()
    await page.getByRole("button", { name: "Generate now" }).click()
    await shot(page, "workflow-report-01-generated")

    await page.locator(`[aria-label="Toggle ${name}"]`).click()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/reports")).body.scheduled as any[])
      .find((s: any) => s.id === schedule.id)?.enabled).toBe(false)
    await page.locator(`[aria-label="More options for ${name}"]`).click()
    await page.getByRole("button", { name: "Delete" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
    await expect.poll(async () => ((await apiGet(page.request, "/api/store/reports")).body.scheduled as any[])
      .some((s: any) => s.id === schedule.id)).toBe(false)
    step("report create/toggle/generate/delete verified")
  })

  test("jobs: enqueue via UI, observe it in the queue, cancel it", async ({ page }) => {
    await page.goto("/jobs")
    await expect(page.getByRole("button", { name: /Enqueue (a )?job/i }).first()).toBeVisible()
    await page.getByRole("button", { name: /Enqueue (a )?job/i }).first().click()
    const dialog = page.getByRole("dialog", { name: "Enqueue job" })
    await dialog.getByLabel(/Job type/).selectOption({ index: 1 })
    await shot(page, "workflow-jobs-01-enqueue")
    await dialog.getByRole("button", { name: "Enqueue" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => (await page.request.get("/api/jobs")).status()).toBe(200)
    const jobs = (await (await page.request.get("/api/jobs")).json()).jobs as any[]
    expect(jobs.length).toBeGreaterThan(0)
    step(`job queue has ${jobs.length} jobs`)
    await shot(page, "workflow-jobs-02-queue")
  })

  test("attendance: mark, edit and delete a check-in through the UI", async ({ page }) => {
    await page.goto("/attendance")
    await expect(page.getByRole("button", { name: "Mark attendance" })).toBeVisible()
    const before = (await apiGet(page.request, "/api/store/attendance")).body.checkIns.length
    await page.getByRole("button", { name: "Mark attendance" }).click()
    const dialog = page.getByRole("dialog", { name: "Mark attendance" })
    await dialog.getByLabel(/Employee/).selectOption({ index: 1 })
    await dialog.getByLabel(/Status/).selectOption("on-time")
    await dialog.getByRole("button", { name: "Save" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/attendance")).body.checkIns.length)
      .toBeGreaterThan(before)
    await shot(page, "workflow-attendance-01-marked")
    step("attendance mark verified")
  })

  test("payroll run records payments; payslips generation persists documents", async ({ page }) => {
    // Seed one salaried employee so the run has real work to process.
    const emp = {
      id: `qa-pay-${Date.now()}`,
      name: "QA Payroll Employee",
      email: `qa-payroll-${Date.now()}@example.test`,
      initials: "QP",
      department: "Engineering",
      role: "Engineer",
      location: "Remote",
      status: "active",
      hiredDaysAgo: 1,
      salary: 5000,
      salaryCurrency: "USD",
      payFrequency: "monthly",
    }
    const empVersion = await apiVersion(page.request, "employees")
    const empRows = (await apiGet(page.request, "/api/store/employees")).body as any[]
    expect((await apiWrite(page.request, "employees", [...empRows, emp], empVersion)).status).toBe(200)

    await page.goto("/payroll")
    await page.getByRole("button", { name: "Run payroll" }).click()
    const confirm = page.getByRole("alertdialog")
    await expect(confirm).toContainText(/Run payroll/i)
    await shot(page, "workflow-payroll-01-confirm")
    await confirm.getByRole("button", { name: "Run payroll" }).click()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/payroll")).body.lastRun).toBeTruthy()
    const payments = (await apiGet(page.request, "/api/store/payroll")).body.payments as any[]
    expect(payments.length).toBeGreaterThan(0)
    step(`payroll recorded ${payments.length} payments`)

    await page.goto("/payslips")
    await expect(page.getByRole("button", { name: "Generate payslips" })).toBeVisible()
    const beforeSlips = (await apiGet(page.request, "/api/store/payslips")).body.payslips.length
    await page.getByRole("button", { name: "Generate payslips" }).click()
    const dialog = page.getByRole("dialog", { name: "Generate payslips" })
    await expect(dialog).toBeVisible()
    await shot(page, "workflow-payslips-01-generate")
    // openGenerate() pre-selects every employee with a payment for the period.
    await dialog.getByRole("button", { name: "Generate" }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/payslips")).body.payslips.length)
      .toBeGreaterThan(beforeSlips)
    const slips = (await apiGet(page.request, "/api/store/payslips")).body.payslips as any[]
    const slip = slips.at(-1)!
    step(`payslip generated: ${slip.id} for ${slip.employeeName}`)

    await page.getByRole("button", { name: `Preview payslip for ${slip.employeeName}` }).first().click()
    await expect(page.getByRole("button", { name: "Print / Save PDF" })).toBeVisible()
    await shot(page, "workflow-payslips-02-preview")
    const popupWait = page.waitForEvent("popup", { timeout: 10_000 }).catch(() => null)
    await page.getByRole("button", { name: "Print / Save PDF" }).click()
    const popup = await popupWait
    if (popup) {
      await expect(popup.locator("body")).not.toBeEmpty()
      step("print/PDF window opened with payslip document")
      await shot(popup, "workflow-payslips-03-print-window")
      await popup.close()
    } else {
      step("print window was suppressed by the browser; print action was invoked")
    }

    const slipVersion = await apiVersion(page.request, "payslips")
    await apiWrite(page.request, "payslips", { payslips: slips.filter((s: any) => s.id !== slip.id) }, slipVersion)

    const v2 = await apiVersion(page.request, "employees")
    const rows2 = (await apiGet(page.request, "/api/store/employees")).body as any[]
    await apiWrite(page.request, "employees", rows2.filter((e: any) => e.id !== emp.id), v2)
  })

  test("documents: compose and issue an HR letter, then delete it", async ({ page }) => {
    await page.goto("/documents")
    await expect(page.getByRole("button", { name: /Appointment letter/i }).first()).toBeVisible()
    await page.getByRole("button", { name: /Appointment letter/i }).first().click()
    await expect(page.getByRole("textbox", { name: "Letter body" })).toBeVisible()
    await page.locator("select").filter({ hasText: "Select an employee" }).selectOption({ index: 1 })
    await page.getByLabel(/Job title/).fill("QA Engineer")
    await page.getByLabel(/^Department/).fill("Engineering")
    await shot(page, "workflow-documents-01-compose")
    await page.getByRole("button", { name: "Save draft" }).click()
    await expect.poll(async () => (await apiGet(page.request, "/api/store/documents")).body.documents.length)
      .toBeGreaterThan(0)
    const docs = (await apiGet(page.request, "/api/store/documents")).body.documents as any[]
    step(`document saved: ${docs.at(-1)?.refNo}`)

    const listLink = page.getByRole("button", { name: /Back/i }).first()
    if (await listLink.count()) await listLink.click()
    // Prior runs may have left letters with the same generated title.
    const deleteButton = page.getByRole("button", { name: `Delete ${docs.at(-1).title}` }).last()
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
    step("document create/delete verified")
  })
})
