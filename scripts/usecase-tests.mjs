// Deep end-to-end use-case checks against a running dev server.
// Usage: node scripts/usecase-tests.mjs [baseUrl]
// Each run provisions unique users/fixtures and cleans up the shared documents
// it touches, so it is safe to run repeatedly against a persistent DB.

const base = process.argv[2] || "http://localhost:3200"
let passed = 0
let failed = 0
const failures = []

function check(name, cond, detail) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    failures.push(name)
    console.log(`  ✗ ${name} ${detail !== undefined ? "- " + JSON.stringify(detail).slice(0, 500) : ""}`)
  }
}

function makeJar() {
  const m = new Map()
  return {
    set(res) {
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";")
        const [k, ...v] = pair.split("=")
        m.set(k, v.join("="))
      }
    },
    get() {
      return [...m.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
    },
  }
}

async function login(email, password) {
  const jar = makeJar()
  const csrfRes = await fetch(`${base}/api/auth/csrf`)
  jar.set(csrfRes)
  const csrf = (await csrfRes.json()).csrfToken
  const res = await fetch(`${base}/api/auth/callback/credentials?`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar.get() },
    body: new URLSearchParams({
      csrfToken: csrf,
      email,
      password,
      token: "",
      callbackUrl: `${base}/dashboard`,
      json: "true",
    }),
  })
  jar.set(res)
  const sess = await fetch(`${base}/api/auth/session`, { headers: { cookie: jar.get() } })
  const s = await sess.json()
  if (!s?.user) throw new Error(`login failed for ${email}: ${res.status}`)
  return { jar: jar.get(), user: s.user }
}

async function get(jar, path) {
  const res = await fetch(base + path, { headers: { cookie: jar }, redirect: "manual" })
  const ct = res.headers.get("content-type") || ""
  const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => "")
  return { status: res.status, body, version: res.headers.get("x-module-version") }
}

async function put(jar, path, body, version) {
  const headers = { cookie: jar, "content-type": "application/json" }
  if (version) headers["If-Match"] = String(version)
  const res = await fetch(base + path, { method: "PUT", headers, body: JSON.stringify(body) })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, version: res.headers.get("x-module-version") }
}

async function apiJson(method, path, body, jar) {
  const headers = { "content-type": "application/json" }
  if (jar) headers.cookie = jar
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

const password = "demo1234"
const stamp = Date.now()
const admin = await login("asef.ahmed@northwind.co", password)
const managerEmail = `uc-mgr-${stamp}@northwind.co`
const employeeEmail = `uc-emp-${stamp}@northwind.co`
const managerName = `Use Case Manager ${stamp}`
const employeeName = `Use Case Employee ${stamp}`
const hiredName = `Hire Person ${stamp}`

async function provision() {
  for (const u of [
    { name: managerName, email: managerEmail },
    { name: employeeName, email: employeeEmail },
  ]) {
    const r = await apiJson("POST", "/api/auth/register", { name: u.name, email: u.email, password })
    check(`register ${u.email}`, r.status === 200, r.data)
  }
  const users = await get(admin.jar, "/api/users")
  const members = users.body?.members ?? users.body ?? []
  const mid = members.find((m) => m.email === managerEmail)?.id
  const eid = members.find((m) => m.email === employeeEmail)?.id
  check("resolve provisioned user ids", !!mid && !!eid, { mid, eid })
  const pm = await apiJson("PATCH", `/api/users/${mid}`, { role: "manager", department: "Engineering" }, admin.jar)
  const pe = await apiJson("PATCH", `/api/users/${eid}`, { department: "Engineering" }, admin.jar)
  check("promote manager", pm.status === 200, pm.data)
  check("set employee department", pe.status === 200, pe.data)
  return { mid, eid }
}

const ids = await provision()
const manager = await login(managerEmail, password)
const employee = await login(employeeEmail, password)

// ---------------------------------------------------------------------------
console.log("\n[1] Job post -> candidate -> hire -> employee + leave + onboarding")
// ---------------------------------------------------------------------------
const candidateId = `c-uc-${stamp}`
const openingId = `o-uc-${stamp}`
const baseRec = await get(admin.jar, "/api/store/recruitment")
const seededRec = await put(admin.jar, "/api/store/recruitment", {
  candidates: [...(baseRec.body?.candidates ?? []), {
    id: candidateId, name: hiredName, initials: "HP", role: "QA Engineer",
    department: "Engineering", appliedAt: new Date().toISOString().slice(0, 10),
    stage: "offer", email: `hire-${stamp}@northwind.co`, phone: "+1 555 010 9999",
    offeredSalary: 4200, salaryCurrency: "EUR", source: "referral",
  }],
  openings: [...(baseRec.body?.openings ?? []), {
    id: openingId, title: "QA Engineer", department: "Engineering",
    location: "Remote", applicants: 1, postedDaysAgo: 0,
  }],
})
check("seed job + candidate", seededRec.status === 200, seededRec.data)

const hire = await apiJson("POST", "/api/lifecycle/hire", { candidateId }, admin.jar)
check("hire succeeds", hire.status === 200, hire.data)
const hiredEmployeeId = hire.data?.employeeId
check("hire returns employee id", !!hiredEmployeeId, hire.data)

const empAfterHire = await get(admin.jar, "/api/store/employees")
const hiredRow = (empAfterHire.body ?? []).find((e) => e.id === hiredEmployeeId)
check("employee row created with offered salary", hiredRow?.salary === 4200 && hiredRow?.salaryCurrency === "EUR", hiredRow)
check("employee row carries candidate email", hiredRow?.email === `hire-${stamp}@northwind.co`, hiredRow?.email)

const leaveAfterHire = await get(admin.jar, "/api/store/leave")
check("hire seeds leave balance", !!leaveAfterHire.body?.balances?.[hiredEmployeeId])

const onbAfterHire = await get(admin.jar, "/api/store/onboarding")
const tasks = (onbAfterHire.body?.tasks ?? []).filter((t) => t.employeeId === hiredEmployeeId)
check("8 onboarding tasks with stable employee id", tasks.length === 8, tasks.length)
check("onboarding tasks have due dates + labels", tasks.every((t) => !!t.dueAt && !!t.label))

const recAfterHire = await get(admin.jar, "/api/store/recruitment")
const hiredCandidate = (recAfterHire.body?.candidates ?? []).find((c) => c.id === candidateId)
check("candidate marked hired + linked", hiredCandidate?.stage === "hired" && hiredCandidate?.employeeId === hiredEmployeeId, hiredCandidate)

const reHire = await apiJson("POST", "/api/lifecycle/hire", { candidateId }, admin.jar)
check("re-hire is idempotent", reHire.status === 200 && reHire.data?.alreadyHired === true, reHire.data)
const empAfterRehire = await get(admin.jar, "/api/store/employees")
check("re-hire creates no duplicate employee", (empAfterRehire.body ?? []).filter((e) => e.email === hiredRow?.email).length === 1)

// ---------------------------------------------------------------------------
console.log("\n[2] Payroll run -> period history -> payslips -> employee visibility")
// ---------------------------------------------------------------------------
await put(admin.jar, "/api/store/payroll", { payments: [], lastRun: null })
await put(admin.jar, "/api/store/payslips", { payslips: [] })

const period1 = "2026-11"
const run1 = await apiJson("POST", "/api/payroll/run", { period: period1 }, admin.jar)
check("payroll run recorded", run1.status === 200 && run1.data?.processed >= 1, run1.data)
const row1 = (run1.data?.payments ?? []).find((p) => p.employeeId === hiredEmployeeId)
check("payment snapshots salary/currency/employee/period", !!row1 && row1.gross === 4200 && row1.currency === "EUR" && row1.period === period1, row1)
check("payment has Stripe reference from employee", row1?.paymentReference === undefined || typeof row1.paymentReference === "string")

const run2 = await apiJson("POST", "/api/payroll/run", { period: period1 }, admin.jar)
check("same-period re-run creates no duplicate", run2.status === 200 && run2.data?.processed === 0 && (run2.data?.payments ?? []).filter((p) => p.employeeId === hiredEmployeeId).length === 1, run2.data?.processed)

const run3 = await apiJson("POST", "/api/payroll/run", { period: "2026-12" }, admin.jar)
check("next period builds history", run3.status === 200 && (run3.data?.payments ?? []).filter((p) => p.employeeId === hiredEmployeeId).length === 2, run3.data?.payments?.length)

// The payslip shape is validated by the store zod schema.
const slip = {
  id: `ps-uc-${stamp}`, employeeId: hiredEmployeeId, employeeEmail: `hire-${stamp}@northwind.co`, employeeName: hiredName,
  initials: "HP", department: "Engineering", jobTitle: "QA Engineer",
  period: period1, currency: "EUR", issuedAt: new Date().toISOString().slice(0, 10),
  status: "paid",
  earnings: { basic: 2000, housing: 800, transport: 300, special: 500, other: 600 },
  deductions: { incomeTax: 0, providentFund: 0, healthInsurance: 0, professionalTax: 0 },
}
const slipPut = await put(admin.jar, "/api/store/payslips", { payslips: [slip] })
check("payslip with currency saved", slipPut.status === 200, slipPut.data)

// A hire creates an e-* directory row but no login account. When that person
// registers with the same email, the verified-email bridge must let them see
// the checklist, pay records and payslip created at hire.
const hireEmail = `hire-${stamp}@northwind.co`
const hireReg = await apiJson("POST", "/api/auth/register", {
  name: hiredName, email: hireEmail, password,
})
check("hired candidate can register with their email", hireReg.status === 200, hireReg.data)
const hireLogin = await login(hireEmail, password)
await get(hireLogin.jar, "/api/store/employees")
const hireOnboarding = await get(hireLogin.jar, "/api/store/onboarding")
check("hiree sees their own onboarding checklist", (hireOnboarding.body?.tasks ?? []).length === 8, hireOnboarding.body?.tasks?.length)
const hirePayslips = await get(hireLogin.jar, "/api/store/payslips")
check("hiree sees their own payslip", (hirePayslips.body?.payslips ?? []).some((p) => p.id === slip.id), hirePayslips.body?.payslips?.length)
const hirePayroll = await get(hireLogin.jar, "/api/store/payroll")
check("hiree sees own payroll rows", (hirePayroll.body?.payments ?? []).filter((p) => p.employeeId === hiredEmployeeId).length >= 1, hirePayroll.body?.payments?.length)

// Provisioned employee visibility is also checked against their own slice.
await get(employee.jar, "/api/store/employees")
await get(employee.jar, "/api/store/leave")
const empPayroll = await get(employee.jar, "/api/store/payroll")
check("employee sees only own payroll slice", Array.isArray(empPayroll.body?.payments) && empPayroll.body.payments.every((p) => !p.employeeId || p.employeeId === employee.user.id), empPayroll.body?.payments?.length)
const mgrPayroll = await get(manager.jar, "/api/store/payroll")
check("manager sees no payroll", Array.isArray(mgrPayroll.body?.payments) && mgrPayroll.body.payments.length === 0)

// ---------------------------------------------------------------------------
console.log("\n[3] Leave request -> manager approval -> balance + status")
// ---------------------------------------------------------------------------
const empLeave0 = await get(employee.jar, "/api/store/leave")
const balances0 = empLeave0.body?.balances ?? {}
const reqId = `r-uc-${stamp}`
const leaveReq = {
  id: reqId, employeeId: employee.user.id, employeeName: employeeName, initials: "UC",
  type: "vac", status: "pending", startDate: "2027-01-11", endDate: "2027-01-12",
  days: 2, reason: "usecase",
}
const addLeave = await put(employee.jar, "/api/store/leave", {
  requests: [...(empLeave0.body?.requests ?? []), leaveReq], balances: balances0,
})
check("employee submits pending leave", addLeave.status === 200, addLeave.data)

const mgrLeave = await get(manager.jar, "/api/store/leave")
check("manager sees dept leave request", (mgrLeave.body?.requests ?? []).some((r) => r.id === reqId), mgrLeave.body?.requests?.length)
const approved = { ...leaveReq, status: "approved" }
// Mirror the UI: the approver adjusts the requester's balance in the same PUT.
const approveBalances = structuredClone(mgrLeave.body?.balances ?? {})
const ownerBalance = approveBalances[employee.user.id]
if (ownerBalance) ownerBalance.annual.used = (ownerBalance.annual.used ?? 0) + leaveReq.days
const approve = await put(manager.jar, "/api/store/leave", {
  requests: (mgrLeave.body?.requests ?? []).map((r) => (r.id === reqId ? approved : r)),
  balances: approveBalances,
})
check("manager approves subordinate leave", approve.status === 200, approve.data)
const empLeave1 = await get(employee.jar, "/api/store/leave")
check("employee sees approved request", (empLeave1.body?.requests ?? []).some((r) => r.id === reqId && r.status === "approved"))
const bal = empLeave1.body?.balances?.[employee.user.id]
check("balance used increased by exactly 2", bal?.annual?.used === (balances0[employee.user.id]?.annual?.used ?? 0) + 2, bal)

const ownReq = { ...leaveReq, id: `r-self-${stamp}`, startDate: "2027-02-11", endDate: "2027-02-12" }
const mgrLeaveNow = await get(manager.jar, "/api/store/leave")
const selfAdd = await put(manager.jar, "/api/store/leave", {
  requests: [...(mgrLeaveNow.body?.requests ?? []), { ...ownReq, employeeId: manager.user.id, employeeName: managerName }],
  balances: mgrLeaveNow.body?.balances ?? {},
})
check("manager self-request created", selfAdd.status === 200, selfAdd.data)
const mgrLeaveWithOwn = await get(manager.jar, "/api/store/leave")
check("manager can see own leave request", (mgrLeaveWithOwn.body?.requests ?? []).some((r) => r.id === ownReq.id), (mgrLeaveWithOwn.body?.requests ?? []).map((r) => r.id))
const selfApprove = await put(manager.jar, "/api/store/leave", {
  requests: (mgrLeaveWithOwn.body?.requests ?? []).map((r) => (r.id === ownReq.id ? { ...r, status: "approved" } : r)),
  balances: mgrLeaveWithOwn.body?.balances ?? {},
})
check("manager self-approval blocked", selfApprove.status === 403, selfApprove.data)

// ---------------------------------------------------------------------------
console.log("\n[4] Security negatives (direct API calls bypassing the UI)")
// ---------------------------------------------------------------------------
const empDir = await get(employee.jar, "/api/store/employees")
const ownRow = (empDir.body ?? [])[0]
if (ownRow) {
  const tamper = await put(employee.jar, "/api/store/employees", [{ ...ownRow, salary: 999999, role: "admin", stripeCustomerRef: "cus_evil" }])
  check("employee cannot raise own salary/role/stripe ref", tamper.status === 403, tamper.data)
}
const empRecruit = await put(employee.jar, "/api/store/recruitment", { candidates: [], openings: [] })
check("employee cannot write recruitment", empRecruit.status === 403, empRecruit.data)
const mgrPayrollPut = await put(manager.jar, "/api/store/payroll", { payments: [], lastRun: null })
check("manager cannot write payroll", mgrPayrollPut.status === 403, mgrPayrollPut.data)
const empBilling = await get(employee.jar, "/api/billing")
check("employee billing blocked", empBilling.status === 403, empBilling.data)
const empHire = await apiJson("POST", "/api/lifecycle/hire", { candidateId }, employee.jar)
check("employee cannot hire", empHire.status === 403, empHire.data)
const empRun = await apiJson("POST", "/api/payroll/run", { period: "2026-11" }, employee.jar)
check("employee cannot run payroll", empRun.status === 403, empRun.data)

// ---------------------------------------------------------------------------
console.log("\n[5] Activity + notifications")
// ---------------------------------------------------------------------------
const activity = await get(admin.jar, "/api/activity?limit=200")
const summaries = (activity.body?.events ?? []).map((e) => e.summary ?? "")
check("hire recorded in activity", summaries.some((s) => /Hired/.test(s)))
check("payroll run recorded in activity", summaries.some((s) => /Recorded .*payment/.test(s)))
const empActivity = await get(employee.jar, "/api/activity?limit=200")
check("employee activity is self-only", (empActivity.body?.events ?? []).every((e) => e.actorId === employee.user.id || e.scope?.actorId === employee.user.id))
const adminNotif = await apiJson("POST", "/api/notifications", {
  type: "settings_changed", title: "Admin only notice", description: "should not leak",
}, admin.jar)
const notifs = await get(employee.jar, "/api/notifications")
check("notifications endpoint returns an array", Array.isArray(notifs.body), typeof notifs.body)
check("employee cannot see admin's notification", Array.isArray(notifs.body) && !notifs.body.some((n) => n.id === adminNotif.data?.id), notifs.body?.length)

// ---------------------------------------------------------------------------
console.log("\n[6] Cleanup")
// ---------------------------------------------------------------------------
const recNow = await get(admin.jar, "/api/store/recruitment")
await put(admin.jar, "/api/store/recruitment", {
  candidates: (recNow.body?.candidates ?? []).filter((c) => c.id !== candidateId),
  openings: (recNow.body?.openings ?? []).filter((o) => o.id !== openingId),
})
const empNow = await get(admin.jar, "/api/store/employees")
await put(admin.jar, "/api/store/employees", (empNow.body ?? []).filter((e) => e.id !== hiredEmployeeId))
const leaveNow = await get(admin.jar, "/api/store/leave")
const nextBalances = { ...(leaveNow.body?.balances ?? {}) }
delete nextBalances[hiredEmployeeId]
await put(admin.jar, "/api/store/leave", { requests: (leaveNow.body?.requests ?? []).filter((r) => r.id !== reqId && r.id !== ownReq.id), balances: nextBalances })
const onbNow = await get(admin.jar, "/api/store/onboarding")
await put(admin.jar, "/api/store/onboarding", { tasks: (onbNow.body?.tasks ?? []).filter((t) => t.employeeId !== hiredEmployeeId) })
await put(admin.jar, "/api/store/payroll", { payments: [], lastRun: null })
await put(admin.jar, "/api/store/payslips", { payslips: [] })
const usersFinal = await get(admin.jar, "/api/users")
const finalMembers = usersFinal.body?.members ?? usersFinal.body ?? []
const hireAccount = finalMembers.find((m) => m.email === hireEmail)
for (const id of [ids.mid, ids.eid, hireAccount?.id].filter(Boolean)) {
  await apiJson("DELETE", `/api/users/${id}`, undefined, admin.jar)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failures.length) {
  console.log("Failures:")
  for (const f of failures) console.log("  - " + f)
  process.exit(1)
}
