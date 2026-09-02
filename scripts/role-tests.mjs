// Role-based integration tests. Exercises the store API, proxy routes, and
// cross-module flows for admin / manager / employee roles against a running
// dev server.
//
// Usage: node scripts/role-tests.mjs [baseUrl]
// Default baseUrl: http://localhost:3200

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
    console.log(`  ✗ ${name} ${detail ? "- " + JSON.stringify(detail) : ""}`)
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
  return { status: res.status, body, location: res.headers.get("location") }
}

async function put(jar, path, body, version) {
  const headers = { cookie: jar, "content-type": "application/json" }
  if (version) headers["If-Match"] = String(version)
  const res = await fetch(base + path, { method: "PUT", headers, body: JSON.stringify(body) })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, version: res.headers.get("x-module-version") }
}

const U = {
  admin: { email: "asef.ahmed@northwind.co", password: "demo1234", role: "admin", name: "Asef Ahmed" },
  manager: { email: "manager@northwind.co", password: "demo1234", role: "manager", department: "Engineering", name: "Morgan Manager" },
  employee: { email: "emp@northwind.co", password: "demo1234", role: "employee", department: "Engineering", name: "Eli Employee" },
}

const sessions = {}
const store = {}

async function apiJson(method, path, body, jar) {
  const headers = { "content-type": "application/json" }
  if (jar) headers.cookie = jar
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}

// The DB starts empty: register the test users via the public API and promote
// the manager account (admin-only PATCH /api/users/:id).
async function ensureUsers() {
  sessions.admin = await login(U.admin.email, U.admin.password)
  for (const u of [U.manager, U.employee]) {
    const reg = await apiJson("POST", "/api/auth/register", {
      name: u.name,
      email: u.email,
      password: u.password,
    })
    if (!(reg.status === 200 || reg.status === 409)) {
      throw new Error(`register failed for ${u.email}: ${reg.status}`)
    }
  }
  const list = await get(sessions.admin.jar, "/api/users")
  const members = Array.isArray(list.body?.members) ? list.body.members : Array.isArray(list.body) ? list.body : []
  const findId = (email) => members.find((m) => m.email === email)?.id
  const mgrId = findId(U.manager.email)
  const empId = findId(U.employee.email)
  if (!mgrId || !empId) throw new Error("could not resolve test user ids: " + JSON.stringify(list.body).slice(0, 300))
  const p1 = await apiJson("PATCH", `/api/users/${mgrId}`, { role: "manager", department: "Engineering" }, sessions.admin.jar)
  check("manager promoted", p1.status === 200, { status: p1.status, err: p1.data })
  const p2 = await apiJson("PATCH", `/api/users/${empId}`, { department: "Engineering" }, sessions.admin.jar)
  check("employee dept set", p2.status === 200, { status: p2.status, err: p2.data })
}

async function hydrate() {
  for (const [name, u] of Object.entries(U)) {
    sessions[name] = await login(u.email, u.password)
    check(`${name} login -> role=${u.role}`, sessions[name].user.role === u.role, sessions[name].user)
    if (u.department) {
      check(`${name} department=${u.department}`, sessions[name].user.department === u.department, sessions[name].user)
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Role-filtered reads
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 0b. Fixtures: the DB starts empty, so seed directory rows for the test
// accounts via the API (admin full replace) before asserting scoping.
// ---------------------------------------------------------------------------
async function seedFixtures() {
  // Use each account's REAL name so manager dept-resolution (which maps
  // directory row names -> departments) matches the leave requests created by
  // these accounts later on.
  const list = await get(sessions.admin.jar, "/api/users")
  const members = Array.isArray(list.body?.members) ? list.body.members : Array.isArray(list.body) ? list.body : []
  const nameOf = (email) => members.find((m) => m.email === email)?.name ?? email.split("@")[0]

  const emp = await get(sessions.admin.jar, "/api/store/employees")
  const rows = Array.isArray(emp.body) ? [...emp.body] : []
  const ensure = (email, dept) => {
    const name = nameOf(email)
    if (!rows.some((e) => e.email === email)) {
      rows.push({
        id: `e-${email.split("@")[0]}`,
        name,
        email,
        initials: name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2),
        department: dept,
        role: dept === "Engineering" ? "Engineer" : "Team Member",
        location: "Test",
        status: "active",
        hiredDaysAgo: 0,
      })
    } else {
      const row = rows.find((e) => e.email === email)
      row.name = name
      row.department = dept
    }
  }
  ensure(U.manager.email, "Engineering")
  ensure(U.employee.email, "Engineering")
  const res = await put(sessions.admin.jar, "/api/store/employees", rows)
  check("fixtures seeded (directory)", res.status === 200, { status: res.status, err: res.data })
}

async function testReads() {
  console.log("\n[1] Role-filtered reads")

  const emp = await get(sessions.admin.jar, "/api/store/employees")
  store.employees = emp.body
  const total = Array.isArray(emp.body) ? emp.body.length : 0
  check("admin reads full directory", Array.isArray(emp.body) && total >= 2, { total })

  const mgr = await get(sessions.manager.jar, "/api/store/employees")
  const mgrRows = Array.isArray(mgr.body) ? mgr.body : []
  check("manager sees only Engineering", mgrRows.length > 0 && mgrRows.every((e) => e.department === "Engineering"), mgrRows.map((e) => e.department))
  check("manager sees own row", mgrRows.some((e) => e.email === U.manager.email))
  check("manager sees dept employee", mgrRows.some((e) => e.email === U.employee.email))

  const emp2 = await get(sessions.employee.jar, "/api/store/employees")
  const empRows = Array.isArray(emp2.body) ? emp2.body : []
  check("employee sees only own row", empRows.length === 1 && empRows[0].email === U.employee.email, empRows)

  const leaveMgr = await get(sessions.manager.jar, "/api/store/leave")
  check("manager leave requests dept-scoped", leaveMgr.status === 200, leaveMgr.status)

  const payrollEmp = await get(sessions.employee.jar, "/api/store/payroll")
  check("employee payroll is empty", Array.isArray(payrollEmp.body?.payments) && payrollEmp.body.payments.length === 0)
}

// ---------------------------------------------------------------------------
// 2. Proxy route protection
// ---------------------------------------------------------------------------
async function testProxy() {
  console.log("\n[2] Proxy route protection")
  const adminOnly = ["/payroll", "/analytics", "/recruitment", "/organization", "/reports", "/documents"]
  const managerRoutes = ["/employees", "/onboarding"]

  for (const path of adminOnly) {
    const r = await get(sessions.employee.jar, path)
    check(`employee blocked from ${path}`, r.status === 307 || r.status === 302, { status: r.status, loc: r.location })
    const r2 = await get(sessions.manager.jar, path)
    check(`manager blocked from ${path}`, r2.status === 307 || r2.status === 302, { status: r2.status, loc: r2.location })
    const r3 = await get(sessions.admin.jar, path)
    check(`admin allowed ${path}`, r3.status === 200, { status: r3.status })
  }
  for (const path of managerRoutes) {
    const r = await get(sessions.employee.jar, path)
    check(`employee blocked from ${path}`, r.status === 307 || r.status === 302, { status: r.status })
    const r2 = await get(sessions.manager.jar, path)
    check(`manager allowed ${path}`, r2.status === 200, { status: r2.status })
  }
}

// ---------------------------------------------------------------------------
// 3. Writes: admin full replace, manager dept-scoped merge, employee self-only
// ---------------------------------------------------------------------------
async function testWrites() {
  console.log("\n[3] Write permissions")

  // Employee cannot add a non-owned row. Base = employee's own filtered view.
  const empView = await get(sessions.employee.jar, "/api/store/employees")
  const evil = await put(sessions.employee.jar, "/api/store/employees", [
    ...empView.body,
    { ...empView.body[0], id: "e-hacker", email: "hacker@x.co", name: "Hacker" },
  ])
  check("employee add-non-owned rejected", evil.status === 403, { status: evil.status })

  // Manager adds a row in their department -> accepted via merge.
  // Base = manager's own filtered slice (their dept only); the merge preserves
  // out-of-scope rows from the stored doc.
  const mgrView = await get(sessions.manager.jar, "/api/store/employees")
  const mgrAdd = { ...mgrView.body[0], id: "e-mgr-test", name: "Mgr Test", email: "mgr.test@northwind.co", department: "Engineering", status: "active", role: "Engineer", location: "Test", initials: "MT", hiredDaysAgo: 0 }
  const mgrPut = await put(sessions.manager.jar, "/api/store/employees", [...mgrView.body, mgrAdd])
  check("manager adds own-dept row accepted", mgrPut.status === 200, { status: mgrPut.status, err: mgrPut.data })
  const afterMgr = await get(sessions.admin.jar, "/api/store/employees")
  check("manager row persisted", Array.isArray(afterMgr.body) && afterMgr.body.some((e) => e.id === "e-mgr-test"))

  // Manager cannot add a row in ANOTHER department.
  const evilMgrAdd = { ...mgrView.body[0], id: "e-mgr-evil", name: "Mgr Evil", email: "mgr.evil@northwind.co", department: "Sales", status: "active", role: "Mgr", location: "X", initials: "ME", hiredDaysAgo: 0 }
  const evilMgr = await put(sessions.manager.jar, "/api/store/employees", [...mgrView.body, evilMgrAdd])
  check("manager add-other-dept rejected", evilMgr.status === 403, { status: evilMgr.status, err: evilMgr.data })

  // Admin writes directly (full doc as base).
  const adminAdd = { ...afterMgr.body[0], id: "e-admin-test", name: "Admin Test", email: "admin.test@northwind.co", department: "Sales", status: "active", role: "Mgr", location: "X", initials: "AT", hiredDaysAgo: 0 }
  const adminPut = await put(sessions.admin.jar, "/api/store/employees", [...afterMgr.body, adminAdd])
  check("admin add row accepted", adminPut.status === 200, { status: adminPut.status })
  const afterAdmin = await get(sessions.admin.jar, "/api/store/employees")
  check("admin row persisted", Array.isArray(afterAdmin.body) && afterAdmin.body.some((e) => e.id === "e-admin-test"))

  // Cleanup: remove test rows.
  const cleaned = (afterAdmin.body || []).filter((e) => !["e-mgr-test", "e-admin-test", "e-mgr-evil"].includes(e.id))
  const cleanPut = await put(sessions.admin.jar, "/api/store/employees", cleaned)
  check("test rows cleaned up", cleanPut.status === 200)
}

// ---------------------------------------------------------------------------
// 4. Cross-module: leave request -> approval -> notification
// ---------------------------------------------------------------------------
async function testLeaveFlow() {
  console.log("\n[4] Leave request -> approval -> notification")
  const empSess = sessions.employee
  const empName = empSess.user.name

  // Employee adds a pending request.
  const leave = await get(empSess.jar, "/api/store/leave")
  const reqId = `r-test-${Date.now()}`
  const newReq = {
    id: reqId,
    employeeId: empSess.user.id,
    employeeName: empName,
    initials: empName.split(/\s+/).map((p) => p[0]).join("").toUpperCase(),
    type: "vac",
    status: "pending",
    startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    days: 3,
    reason: "Integration test leave",
  }
  const newDoc = {
    ...leave.body,
    requests: [...(leave.body.requests || []), newReq],
    balances: { ...(leave.body.balances || {}) },
  }
  const add = await put(empSess.jar, "/api/store/leave", newDoc)
  check("employee adds pending leave", add.status === 200, { status: add.status, err: add.data })

  // Manager sees the pending request.
  const mgrLeave = await get(sessions.manager.jar, "/api/store/leave")
  const pending = (mgrLeave.body?.requests || []).find((r) => r.id === reqId)
  check("manager sees employee request", !!pending, mgrLeave.body?.requests?.map((r) => r.id))

  // Manager approves it.
  const approvedDoc = {
    ...mgrLeave.body,
    requests: (mgrLeave.body.requests || []).map((r) =>
      r.id === reqId ? { ...r, status: "approved" } : r,
    ),
  }
  const approve = await put(sessions.manager.jar, "/api/store/leave", approvedDoc)
  check("manager approves request", approve.status === 200, { status: approve.status, err: approve.data })

  // Employee sees it approved.
  const empLeave2 = await get(empSess.jar, "/api/store/leave")
  const mine = (empLeave2.body?.requests || []).find((r) => r.id === reqId)
  check("employee sees approved status", mine?.status === "approved", mine)

  // Cleanup: admin removes test request.
  const adminLeave = await get(sessions.admin.jar, "/api/store/leave")
  const cleaned = {
    ...adminLeave.body,
    requests: (adminLeave.body.requests || []).filter((r) => r.id !== reqId),
  }
  const clean = await put(sessions.admin.jar, "/api/store/leave", cleaned)
  check("test leave cleaned up", clean.status === 200)
}

// ---------------------------------------------------------------------------
// 5. Non-admin writes to admin-only modules are rejected
// ---------------------------------------------------------------------------
async function testAdminOnlyWrites() {
  console.log("\n[5] Non-admin writes to admin-only modules")
  const modules = ["recruitment", "analytics", "reports", "organization", "payroll", "documents"]
  for (const key of modules) {
    const doc = await get(sessions.admin.jar, `/api/store/${key}`)
    const r = await put(sessions.manager.jar, `/api/store/${key}`, doc.body)
    check(`manager PUT ${key} rejected`, r.status === 403, { status: r.status, err: r.data })
  }
}

// ---------------------------------------------------------------------------
// 6. Announcements: everyone reads, only admins write
// ---------------------------------------------------------------------------
async function testAnnouncements() {
  console.log("\n[6] Announcements access")
  const ann = { announcements: [{ id: `an-test-${Date.now()}`, title: "Test notice", body: "Hello team", author: "Asef Ahmed", pinned: false, createdAt: Date.now() }] }
  const post = await put(sessions.admin.jar, "/api/store/announcements", ann)
  check("admin posts announcement", post.status === 200, { status: post.status, err: post.data })

  const empRead = await get(sessions.employee.jar, "/api/store/announcements")
  check("employee reads announcements", empRead.status === 200 && empRead.body?.announcements?.length >= 1)

  const mgrWrite = await put(sessions.manager.jar, "/api/store/announcements", empRead.body)
  check("manager announcement write rejected", mgrWrite.status === 403, { status: mgrWrite.status })

  // Cleanup
  await put(sessions.admin.jar, "/api/store/announcements", { announcements: [] })
}

// ---------------------------------------------------------------------------
// 7. Hardening: identity immutability, read-only modules, billing, profile
// ---------------------------------------------------------------------------
async function testHardening() {
  console.log("\n[7] Hardening (identity immutability, read-only, billing, profile)")

  // --- Performance reviews are read-only for employees ---
  const perfEmp = await get(sessions.employee.jar, "/api/store/performance")
  const ownReviews = Array.isArray(perfEmp.body?.reviews) ? perfEmp.body.reviews : []
  const fakeReview = {
    id: `r-evil-${Date.now()}`,
    initials: "EE",
    avatarBg: "bg-foreground",
    name: sessions.employee.user.name,
    role: "Engineer",
    deptDot: "bg-foreground",
    department: "Engineering",
    reviewer: "You",
    rating: 5,
    status: "exceeds",
    reviewedAt: new Date().toISOString().slice(0, 10),
  }
  const perfWrite = await put(sessions.employee.jar, "/api/store/performance", {
    reviews: [...ownReviews, fakeReview],
    teamScores: perfEmp.body?.teamScores ?? [],
  })
  check("employee performance write rejected", perfWrite.status === 403, {
    status: perfWrite.status,
    err: perfWrite.data,
  })

  // --- Directory identity fields are immutable for non-admins ---
  const empDir = await get(sessions.employee.jar, "/api/store/employees")
  const ownRow = empDir.body?.[0]
  check("employee has a directory row", !!ownRow, empDir.body)
  if (ownRow) {
    const emailSwap = await put(sessions.employee.jar, "/api/store/employees", [
      { ...ownRow, email: "hijack@northwind.co" },
    ])
    check("employee email change rejected", emailSwap.status === 403, {
      status: emailSwap.status,
      err: emailSwap.data,
    })

    const deptMove = await put(sessions.employee.jar, "/api/store/employees", [
      { ...ownRow, department: "Sales" },
    ])
    check("employee department change rejected", deptMove.status === 403, {
      status: deptMove.status,
    })

    const selfAdd = await put(sessions.employee.jar, "/api/store/employees", [
      ...empDir.body,
      { ...ownRow, id: `e-forged-${Date.now()}`, email: "forged@northwind.co" },
    ])
    check("employee directory self-add rejected", selfAdd.status === 403, {
      status: selfAdd.status,
    })

    const selfRemove = await put(sessions.employee.jar, "/api/store/employees", [])
    check("employee directory self-remove rejected", selfRemove.status === 403, {
      status: selfRemove.status,
    })
  }

  const mgrDir = await get(sessions.manager.jar, "/api/store/employees")
  const empRowInMgrScope = (mgrDir.body || []).find((e) => e.email === U.employee.email)
  check("manager sees employee row", !!empRowInMgrScope, mgrDir.body)
  if (empRowInMgrScope) {
    const mgrEmailSwap = await put(sessions.manager.jar, "/api/store/employees", [
      ...(mgrDir.body || []).map((e) =>
        e.id === empRowInMgrScope.id ? { ...e, email: "stolen@northwind.co" } : e,
      ),
    ])
    check("manager email change rejected", mgrEmailSwap.status === 403, {
      status: mgrEmailSwap.status,
      err: mgrEmailSwap.data,
    })

    const mgrRemove = await put(
      sessions.manager.jar,
      "/api/store/employees",
      (mgrDir.body || []).filter((e) => e.id !== empRowInMgrScope.id),
    )
    check("manager row removal rejected", mgrRemove.status === 403, { status: mgrRemove.status })
  }

  // --- Leave requests can't be re-owned ---
  const leaveEmp = await get(sessions.employee.jar, "/api/store/leave")
  let ownPending = (leaveEmp.body?.requests || []).find(
    (r) => r.status === "pending" && r.employeeId === sessions.employee.user.id,
  )
  if (!ownPending) {
    const reqId = `r-swap-${Date.now()}`
    const name = sessions.employee.user.name
    const tmp = {
      id: reqId,
      employeeId: sessions.employee.user.id,
      employeeName: name,
      initials: name.split(/\s+/).map((p) => p[0]).join("").toUpperCase(),
      type: "pers",
      status: "pending",
      startDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 10),
      days: 2,
      reason: "swap test",
    }
    const addTmp = await put(sessions.employee.jar, "/api/store/leave", {
      ...leaveEmp.body,
      requests: [...(leaveEmp.body.requests || []), tmp],
    })
    check("swap-test request added", addTmp.status === 200, {
      status: addTmp.status,
      err: addTmp.data,
    })
    ownPending = addTmp.status === 200 ? tmp : null
  }
  if (ownPending) {
    // Re-read so the swap attempt is based on the doc that actually contains
    // the pending request (otherwise the PUT would just cancel it).
    const leaveNow0 = await get(sessions.employee.jar, "/api/store/leave")
    const swap = await put(sessions.employee.jar, "/api/store/leave", {
      ...leaveNow0.body,
      requests: (leaveNow0.body.requests || []).map((r) =>
        r.id === ownPending.id ? { ...r, employeeName: "Someone Else" } : r,
      ),
    })
    check("leave owner change rejected", swap.status === 403, {
      status: swap.status,
      err: swap.data,
    })
    // Cleanup the swap-test request if we created one.
    if (ownPending.reason === "swap test") {
      const leaveNow = await get(sessions.employee.jar, "/api/store/leave")
      if ((leaveNow.body?.requests || []).some((r) => r.id === ownPending.id)) {
        await put(sessions.employee.jar, "/api/store/leave", {
          ...leaveNow.body,
          requests: leaveNow.body.requests.filter((r) => r.id !== ownPending.id),
        })
      }
    }
  }

  // --- Billing is admin-only ---
  const billEmp = await get(sessions.employee.jar, "/api/billing")
  check("employee billing rejected", billEmp.status === 403, { status: billEmp.status })
  const billMgr = await get(sessions.manager.jar, "/api/billing")
  check("manager billing rejected", billMgr.status === 403, { status: billMgr.status })
  const billAdmin = await get(sessions.admin.jar, "/api/billing")
  check("admin billing allowed", billAdmin.status === 200, { status: billAdmin.status })

  // --- Department is not self-serviceable ---
  const mgrProfile = await apiJson(
    "PATCH",
    "/api/user/profile",
    { name: sessions.manager.user.name, email: U.manager.email, department: "Sales" },
    sessions.manager.jar,
  )
  check("manager profile dept change accepted-but-ignored", mgrProfile.status === 200, {
    status: mgrProfile.status,
    err: mgrProfile.data,
  })
  const usersAfter = await get(sessions.admin.jar, "/api/users")
  const mgrAfter = (usersAfter.body || []).find((m) => m.email === U.manager.email)
  check("manager department unchanged", mgrAfter?.department === "Engineering", mgrAfter)
}

// ---------------------------------------------------------------------------
// 8. Announcements audience targeting
// ---------------------------------------------------------------------------
async function testAnnouncementAudience() {
  console.log("\n[8] Announcements audience filtering")
  const now = Date.now()
  const salesOnly = {
    announcements: [
      { id: `an-sales-${now}`, title: "Sales only", body: "For the Sales team", author: "Asef Ahmed", audience: "Sales", pinned: false, createdAt: now },
    ],
  }
  const post = await put(sessions.admin.jar, "/api/store/announcements", salesOnly)
  check("admin posts Sales-only announcement", post.status === 200, { status: post.status, err: post.data })

  const empSee = await get(sessions.employee.jar, "/api/store/announcements")
  check("Engineering employee does NOT see Sales notice", !(empSee.body?.announcements || []).some((a) => a.id === `an-sales-${now}`))

  const engOnly = {
    announcements: [
      { id: `an-sales-${now}`, title: "Sales only", body: "For the Sales team", author: "Asef Ahmed", audience: "Sales", pinned: false, createdAt: now },
      { id: `an-eng-${now}`, title: "Engineering only", body: "For the Engineering team", author: "Asef Ahmed", audience: "Engineering", pinned: false, createdAt: now },
    ],
  }
  await put(sessions.admin.jar, "/api/store/announcements", engOnly)
  const empSee2 = await get(sessions.employee.jar, "/api/store/announcements")
  check("Engineering employee DOES see Engineering notice", (empSee2.body?.announcements || []).some((a) => a.id === `an-eng-${now}`))
  check("Engineering employee still does NOT see Sales notice", !(empSee2.body?.announcements || []).some((a) => a.id === `an-sales-${now}`))
  const mgrSee = await get(sessions.manager.jar, "/api/store/announcements")
  check("Engineering manager sees Engineering notice", (mgrSee.body?.announcements || []).some((a) => a.id === `an-eng-${now}`))
  const adminSee = await get(sessions.admin.jar, "/api/store/announcements")
  check("admin sees all announcements", (adminSee.body?.announcements || []).some((a) => a.id === `an-sales-${now}`) && (adminSee.body?.announcements || []).some((a) => a.id === `an-eng-${now}`))

  // Cleanup
  await put(sessions.admin.jar, "/api/store/announcements", { announcements: [] })
}

async function main() {
  console.log(`Role integration tests against ${base}\n`)
  try {
    await ensureUsers()
    await hydrate()
  } catch (e) {
    console.log("FATAL: could not log in - " + e.message)
    process.exit(1)
  }
  await seedFixtures()
  await testReads()
  await testProxy()
  await testWrites()
  await testLeaveFlow()
  await testAdminOnlyWrites()
  await testAnnouncements()
  await testHardening()
  await testAnnouncementAudience()

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failures.length) {
    console.log("Failures:")
    for (const f of failures) console.log("  - " + f)
    process.exit(1)
  }
}

main()
