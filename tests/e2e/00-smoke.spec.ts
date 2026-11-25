import { test, expect, login, shot, step, BASE_URL } from "./helpers"

test("environment: server, browser and admin login", async ({ page, browserLog }) => {
  step(`base URL ${BASE_URL}`)
  const server = await page.request.get("/login")
  expect(server.status(), "app reachable").toBe(200)

  await page.goto("/")
  await expect(page.locator("body")).toContainText(/PeopleHR/i)

  await login(page, "admin")
  step("admin landed on dashboard")
  expect(page.url()).toContain("/dashboard")
  await shot(page, "smoke-01-admin-dashboard")

  const session = await page.request.get("/api/auth/session")
  expect(session.status()).toBe(200)
  expect((await session.json()).user.role).toBe("admin")

  step(`browser diagnostics: ${JSON.stringify(browserLog)}`)
  expect(browserLog.pageErrors, "no uncaught page errors").toEqual([])
})
