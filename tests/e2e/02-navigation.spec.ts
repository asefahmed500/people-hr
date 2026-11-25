import { test, expect, shot, step, expectNoHorizontalOverflow, type Role } from "./helpers"

const ALL_ROUTES = [
  ["/dashboard", "Dashboard"],
  ["/activity", "Activity"],
  ["/employees", "Employees"],
  ["/organization", "Organization"],
  ["/attendance", "Attendance"],
  ["/leave", "Leave"],
  ["/recruitment", "Recruitment"],
  ["/onboarding", "Onboarding"],
  ["/projects", "Projects"],
  ["/performance", "Performance"],
  ["/goals", "Goals"],
  ["/payroll", "Payroll"],
  ["/payslips", "Payslips"],
  ["/reports", "Reports"],
  ["/documents", "Documents"],
  ["/analytics", "Analytics"],
  ["/jobs", "Jobs"],
  ["/assistant", "AI Assistant"],
  ["/announcements", "Announcements"],
  ["/settings", "Settings"],
] as const

const ADMIN_ONLY = new Set(["/organization", "/recruitment", "/payroll", "/reports", "/documents", "/analytics", "/jobs"])
const MANAGER_ONLY = new Set(["/employees"])

function allowed(role: Role, href: string): boolean {
  if (role === "admin") return true
  if (ADMIN_ONLY.has(href)) return false
  if (role === "manager") return true
  return !MANAGER_ONLY.has(href)
}

const authFile = (role: Role) => `tests/reports/auth/${role}.json`

test.describe("Admin navigation & shell", () => {
  test.use({ storageState: authFile("admin") })

  test("click through every sidebar route; each renders real content", async ({ page, browserLog }) => {
    await page.goto("/dashboard")
    for (const [href, label] of ALL_ROUTES) {
      step(`navigate ${href}`)
      const link = page.getByRole("link", { name: label, exact: true }).first()
      await expect(link, `sidebar link ${label}`).toBeVisible()
      await link.click()
      await expect(page).toHaveURL(new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
      await expect(page.locator("body")).not.toContainText(/couldn.t load this page/i)
      await expect(page.locator("body"), `${href} has content`).not.toBeEmpty()
      await expectNoHorizontalOverflow(page)
      await shot(page, `nav-admin-${href.slice(1)}`)
    }
    expect(browserLog.pageErrors, "no uncaught exceptions across all admin routes").toEqual([])
  })

  test("theme, command palette, notifications, sidebar collapse, account menu", async ({ page, browserLog }) => {
    await page.goto("/dashboard")

    const themeTrigger = page.getByRole("button", { name: /Switch to (dark|light) mode/ })
    await themeTrigger.click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await shot(page, "shell-01-dark-mode")
    await page.getByRole("button", { name: /Switch to light mode/ }).click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)

    await page.keyboard.press("Control+k")
    const palette = page.getByRole("dialog")
    await expect(palette).toBeVisible()
    const search = page.locator("[data-slot='command-input']")
    await expect(search).toBeFocused()
    await search.fill("payslip")
    await expect(palette).toContainText(/payslip/i)
    await shot(page, "shell-02-command-palette")
    await page.keyboard.press("Escape")
    await expect(palette).toBeHidden()

    const bell = page.getByRole("button", { name: /Notifications/ }).first()
    if (await bell.count()) {
      await bell.click()
      await expect(page.getByText(/Notifications/).first()).toBeVisible()
      await shot(page, "shell-03-notifications")
      await page.keyboard.press("Escape")
    }

    const collapse = page.getByRole("button", { name: "Collapse sidebar" })
    if (await collapse.count()) {
      await collapse.click()
      await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible()
      await shot(page, "shell-04-sidebar-collapsed")
      await page.getByRole("button", { name: "Expand sidebar" }).click()
    }

    await page.getByRole("button", { name: "Account menu" }).click()
    await expect(page.getByRole("menuitem", { name: /Settings/ })).toBeVisible()
    await shot(page, "shell-05-account-menu")

    expect(browserLog.pageErrors).toEqual([])
  })
})

for (const role of ["manager", "employee"] as const) {
  test.describe(`${role} route permissions`, () => {
    test.use({ storageState: authFile(role) })

    test(`role-based route protection matches the matrix`, async ({ page }) => {
      for (const [href, label] of ALL_ROUTES) {
        await page.goto(href)
        if (allowed(role, href)) {
          await expect(page, `${role} allowed ${href}`).toHaveURL(new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
          await expect(page.locator("body")).not.toContainText(/couldn.t load this page/i)
          const link = page.getByRole("link", { name: label, exact: true }).first()
          if (role === "employee" && href === "/onboarding") {
            // Employees may read their own checklist by URL but it is hidden in nav.
            await expect(link, "onboarding hidden from employee nav").toHaveCount(0)
          } else {
            await expect(link, `${role} sidebar ready on ${href}`).toBeVisible({ timeout: 20_000 })
          }
        } else {
          await expect(page, `${role} blocked from ${href}`).toHaveURL(/\/dashboard$/)
          const link = page.getByRole("link", { name: label, exact: true })
          await expect(link, `${role} must not see ${label}`).toHaveCount(0)
        }
      }
      await shot(page, `nav-permissions-${role}`)
    })
  })
}

test.describe("Anonymous access", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("unauthenticated direct URLs redirect to login with callbackUrl", async ({ page }) => {
    for (const [href] of ALL_ROUTES) {
      await page.goto(href)
      await expect(page, `anonymous redirected from ${href}`).toHaveURL(/\/login\?callbackUrl=/)
    }
    await shot(page, "nav-anonymous-redirect")
  })
})
