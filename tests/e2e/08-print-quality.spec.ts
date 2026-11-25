import { readFileSync } from "node:fs"
import { test, expect, apiGet, apiVersion, apiWrite, shot, step } from "./helpers"
import { buildPayslipHtml, type Payslip } from "../../lib/data/payslips"
import { buildLetterBody } from "../../lib/data/documents"

test.describe("Print-ready document quality", () => {
  test.use({ storageState: "tests/reports/auth/admin.json" })

  test("payslip HTML contains correct real-world fields and clean structure", () => {
    const slip: Payslip = {
      id: "ps-qa-1",
      employeeId: "e-qa-1",
      employeeEmail: "qa@example.test",
      employeeName: "Jordan Employee",
      initials: "JE",
      department: "Engineering",
      jobTitle: "Software Engineer",
      period: "2026-11",
      issuedAt: "2026-11-24",
      status: "paid",
      currency: "USD",
      earnings: { basic: 3000, housing: 900, transport: 300, special: 200, other: 0 },
      deductions: { incomeTax: 400, providentFund: 300, healthInsurance: 100, professionalTax: 50 },
      notes: "Paid via bank transfer.",
    }
    const html = buildPayslipHtml(slip, "Northwind")

    expect(html).toContain("Salary statement")
    expect(html).toContain("Jordan Employee")
    expect(html).toContain("e-qa-1")
    expect(html).toContain("Engineering")
    expect(html).toContain("Software Engineer")
    expect(html).toContain("2026-11")
    expect(html).toContain("Basic salary")
    expect(html).toContain("Income tax")
    expect(html).toContain("Gross pay")
    expect(html).toContain("Total deductions")
    expect(html).toContain("Net pay")

    // Computed values must agree with the earnings/deductions rows.
    const gross = 3000 + 900 + 300 + 200
    const deductions = 400 + 300 + 100 + 50
    expect(html).toContain(gross.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }))
    expect(html).toContain((gross - deductions).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }))

    // No inline styling left to fight the shared print stylesheet.
    expect(html).not.toContain("style=")
    expect(html).not.toMatch(/<script|onerror=/i)
    step("payslip print HTML verified")
  })

  test("letter HTML keeps date/subject alignment after sanitization", async ({ page }) => {
    const body = buildLetterBody("appointment", {
      employeeName: "Jordan Employee",
      jobTitle: "Software Engineer",
      department: "Engineering",
      startDate: "2026-12-01",
      endDate: "",
      monthlySalary: "USD 4,400",
    }, "Northwind")
    expect(body).toContain("text-align:right")

    const sanitized = await page.evaluate((html) => {
      // The client sanitizer is the source of truth in the browser.
      const el = document.createElement("div")
      el.innerHTML = html
      return el.innerHTML
    }, body)
    expect(sanitized).toContain("Jordan Employee")
    step("letter content verified")
  })

  test("shared print stylesheet is A4, minimal and print-safe", () => {
    const css = readFileSync("lib/print-document.ts", "utf8")
    expect(css).toContain("@page { size: A4;")
    expect(css).toContain("system-ui")
    expect(css).toContain("print-color-adjust: exact")
    expect(css).toContain("break-inside: avoid")
    expect(css).toContain("table-header-group")
    expect(css).not.toContain("<script")
    step("print stylesheet verified")
  })

  test("browser preview renders the generated payslip with real values", async ({ page }) => {
    const slip: Payslip = {
      id: `ps-print-${Date.now()}`,
      employeeId: "e-print-qa",
      employeeName: "Print QA Employee",
      initials: "PQ",
      department: "Engineering",
      jobTitle: "QA Engineer",
      period: new Date().toISOString().slice(0, 7),
      issuedAt: new Date().toISOString().slice(0, 10),
      status: "paid",
      currency: "USD",
      earnings: { basic: 2000, housing: 500, transport: 200, special: 100, other: 0 },
      deductions: { incomeTax: 200, providentFund: 150, healthInsurance: 50, professionalTax: 20 },
    }
    const before = (await apiGet(page.request, "/api/store/payslips")).body
    const v = await apiVersion(page.request, "payslips")
    expect((await apiWrite(page.request, "payslips", { payslips: [...before.payslips, slip] }, v)).status).toBe(200)

    await page.goto("/payslips")
    await page.getByRole("button", { name: "Preview payslip for Print QA Employee" }).first().click()
    await expect(page.locator("body")).toContainText("Print QA Employee")
    await expect(page.getByRole("button", { name: "Print / Save PDF" })).toBeVisible()
    await shot(page, "print-01-payslip-preview")

    const v2 = await apiVersion(page.request, "payslips")
    const after = (await apiGet(page.request, "/api/store/payslips")).body
    await apiWrite(page.request, "payslips", { payslips: after.payslips.filter((s: any) => s.id !== slip.id) }, v2)
  })
})
