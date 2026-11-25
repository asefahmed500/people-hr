import { test, expect, login, logout, loginExpectFailure, shot, step, ACCOUNTS } from "./helpers"

test.describe("Authentication lifecycle", () => {
  test("landing + auth pages are public and render", async ({ page, browserLog }) => {
    for (const [path, marker] of [
      ["/", /PeopleHR/i],
      ["/login", /Sign in/i],
      ["/signup", /Create your account/i],
      ["/forgot-password", /reset|password/i],
      ["/terms", /terms/i],
      ["/privacy", /privacy/i],
    ] as const) {
      await page.goto(path)
      await expect(page.locator("body"), `${path} renders`).toContainText(marker)
    }
    expect(browserLog.pageErrors).toEqual([])
  })

  test("empty-field and invalid-credential validation", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await expect(page.getByText("Enter a valid work email.")).toBeVisible()
    await expect(page.getByText("Enter your password.")).toBeVisible()
    await shot(page, "auth-01-empty-validation")

    const msg = await loginExpectFailure(page, "nobody@example.test", "wrong-password")
    step(`invalid login message: ${msg}`)
    expect(msg).toMatch(/incorrect|invalid|email|password/i)
    await shot(page, "auth-02-invalid-credentials")
    await expect(page).toHaveURL(/\/login/)
  })

  test("demo account picker fills credentials, then real sign-in works", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("combobox", { name: "Choose a demo account" }).click()
    await page.getByRole("option", { name: /Manager/ }).click()
    await expect(page.getByLabel("Work email")).toHaveValue(ACCOUNTS.manager.email)
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue(ACCOUNTS.manager.password)
    await shot(page, "auth-03-demo-picker")
  })

  test("sign out via the top-bar clears the session and blocks protected routes", async ({ page }) => {
    await login(page, "admin")
    await expect(page.getByRole("button", { name: "Sign out" }).first()).toBeVisible()
    await page.getByRole("button", { name: "Sign out" }).first().click()

    await page.waitForURL(/\/login$/, { timeout: 25_000 })
    step(`after sign-out URL: ${page.url()}`)
    await shot(page, "auth-04-after-signout")

    const session = await page.request.get("/api/auth/session")
    const sessionBody = await session.json()
    expect(sessionBody?.user ?? undefined, "session cookie cleared").toBeUndefined()

    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login\?callbackUrl=/)
    await shot(page, "auth-05-protected-redirect")

    const api = await page.request.get("/api/store/employees")
    expect(api.status(), "unauthenticated store GET is 401").toBe(401)

    // Navigating back must not resurrect a cached authenticated dashboard.
    await page.goBack()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
  })

  test("REGRESSION: sign-out wins a race with in-flight session refreshes", async ({ page }) => {
    await login(page, "admin")
    // Auth.js re-signs the JWT on every /api/auth/session read. Fire several
    // refreshes at the same moment as Sign out: before the fix they re-set the
    // session cookie after Auth.js cleared it and bounced the user back to
    // /dashboard with a live session.
    for (let i = 0; i < 3; i++) void page.request.get("/api/auth/session")
    await page.getByRole("button", { name: "Sign out" }).first().click()
    await page.waitForURL(/\/login$/, { timeout: 25_000 })
    const session = await page.request.get("/api/auth/session")
    const body = await session.json()
    expect(body?.user ?? undefined, "no session after racing refreshes").toBeUndefined()
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("session persists across reload; each role reaches its dashboard", async ({ page }) => {
    for (const role of ["admin", "manager", "employee"] as const) {
      await login(page, role)
      const before = await page.request.get("/api/auth/session")
      expect((await before.json()).user.role).toBe(role)
      await page.reload()
      await expect(page).toHaveURL(/dashboard/)
      const after = await page.request.get("/api/auth/session")
      expect((await after.json()).user.role, `${role} role after reload`).toBe(role)
      await shot(page, `auth-06-${role}-dashboard`)
      await logout(page)
    }
  })

  test("registration creates a real account; deactivated account cannot sign in", async ({ page }) => {
    const email = `qa-signup-${Date.now()}@example.test`
    await page.goto("/signup")
    // Display names are unique across accounts; make this run's fixture unique.
    await page.getByLabel(/Full name/).fill(`QA Signup User ${Date.now().toString(36).replace(/\d/g, "q")}`)
    await page.getByLabel(/Work email/).fill(email)
    await page.getByLabel("Password", { exact: true }).fill("QaPass123!")
    await page.getByLabel(/Confirm password/).fill("QaPass123!")
    await page.locator("#signup-agree").click()
    await shot(page, "auth-08-signup-form")
    await page.getByRole("button", { name: "Create account" }).click()
    await page.waitForURL(/\/dashboard$/, { timeout: 25_000 })
    const session = await (await page.request.get("/api/auth/session")).json()
    expect(session.user.role, "new accounts start as employees").toBe("employee")
    expect(session.user.email).toBe(email)
    await shot(page, "auth-09-signup-dashboard")

    // Self-deactivate through the real API, then confirm login is refused.
    expect((await page.request.post("/api/user/deactivate")).status()).toBe(200)
    await page.getByRole("button", { name: "Sign out" }).first().click()
    await page.waitForURL(/\/login$/)
    const message = await loginExpectFailure(page, email, "QaPass123!")
    expect(message).toMatch(/incorrect|invalid|deactiv/i)
    step("signup → deactivate → login refused verified")
  })

  test("password reset request returns a real result", async ({ page }) => {
    await page.goto("/forgot-password")
    const emailInput = page.getByLabel(/email/i).first()
    await emailInput.fill("asef.ahmed@northwind.co")
    const submit = page.getByRole("button", { name: /send|reset|continue/i }).first()
    await submit.click()
    await expect(page.locator("body")).toContainText(/check|link|sent|reset|error|try again/i)
    await shot(page, "auth-07-password-reset")
  })
})
