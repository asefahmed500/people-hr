import { test, expect, shot, step, expectNoHorizontalOverflow } from "./helpers"

const ROUTES = ["/dashboard", "/employees", "/leave", "/projects", "/settings", "/analytics", "/documents", "/assistant"]

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width}x${viewport.height}`, () => {
    test.use({ storageState: "tests/reports/auth/admin.json", viewport: { width: viewport.width, height: viewport.height } })

    test("representative pages render without overflow or runtime errors", async ({ page, browserLog }) => {
      for (const route of ROUTES) {
        await page.goto(route)
        await expect(page.locator("body")).not.toContainText(/couldn.t load this page/i)
        await expect(page.locator("body"), `${route} has content`).not.toBeEmpty()
        // Soft assertion: a layout defect is recorded but doesn't hide other routes.
        await expect.soft(await expectNoHorizontalOverflow(page), `${route} has no document overflow`).toBeLessThanOrEqual(2)
        await shot(page, `responsive-${viewport.name}-${route.slice(1)}`)
      }
      expect(browserLog.pageErrors, "no runtime errors").toEqual([])
    })
  })
}

test.describe("Mobile navigation", () => {
  test.use({ storageState: "tests/reports/auth/admin.json", viewport: { width: 390, height: 844 } })

  test("navigation sheet opens and a link navigates", async ({ page }) => {
    await page.goto("/dashboard")
    const open = page.getByRole("button", { name: "Open navigation" })
    await expect(open).toBeVisible()
    await open.click()
    await expect(page.getByRole("dialog", { name: /Navigation/i })).toBeVisible()
    await shot(page, "responsive-mobile-nav-open")
    await page.getByRole("dialog", { name: /Navigation/i }).getByRole("link", { name: "Leave" }).click()
    await expect(page).toHaveURL(/\/leave$/)
    step("mobile navigation works")
  })
})
