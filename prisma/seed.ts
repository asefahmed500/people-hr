import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { DEMO_ACCOUNTS, DEMO_EMAIL } from "../lib/data/session"
import { MODULE_DEFAULTS, MODULE_KEYS } from "../lib/module-defaults"
import { defaultSettingsStore } from "../lib/data/settings"

const prisma = new PrismaClient()

// The database starts EMPTY of feature data: no fake people, leave requests,
// payments, etc. Only the three demo LOGIN accounts (admin/manager/employee)
// and per-module state shells are created. Feature records come from the UI.
async function main() {
  console.log("🧹 Cleaning database...")
  const clearOrder = [
    prisma.chatMessage.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.settings.deleteMany(),
    prisma.moduleState.deleteMany(),
    prisma.keyResult.deleteMany(),
    prisma.objective.deleteMany(),
    prisma.analyticsTrend.deleteMany(),
    prisma.analyticsDept.deleteMany(),
    prisma.analyticsTenure.deleteMany(),
    prisma.analytics.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.leaveBalance.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.opening.deleteMany(),
    prisma.projectTask.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.payrollMeta.deleteMany(),
    prisma.review.deleteMany(),
    prisma.teamScore.deleteMany(),
    prisma.onboardingTask.deleteMany(),
    prisma.checkIn.deleteMany(),
    prisma.deptHeat.deleteMany(),
    prisma.dept.deleteMany(),
    prisma.office.deleteMany(),
    prisma.orgNode.deleteMany(),
    prisma.reportTemplate.deleteMany(),
    prisma.scheduledReport.deleteMany(),
    prisma.recentReport.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]
  await Promise.all(clearOrder)

  // --- Demo admin (credentials) ---
  console.log("👤 Creating demo admin...")
  const passwordHash = await bcrypt.hash("demo1234", 10)
  const admin = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: "admin", department: "People" },
    create: {
      id: "u-asef",
      name: "Asef Ahmed",
      email: DEMO_EMAIL,
      role: "admin",
      department: "People",
      initials: "AA",
      password: passwordHash,
    },
  })

  // Demo manager + employee so the login-page role picker works out of the box.
  console.log("👥 Creating demo manager and employee...")
  for (const account of DEMO_ACCOUNTS.filter((a) => a.id !== "admin")) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { role: account.id, password: passwordHash },
      create: {
        email: account.email,
        name: account.label,
        role: account.id,
        department: "Engineering",
        initials: account.id === "manager" ? "MM" : "EE",
        password: passwordHash,
      },
    })
  }

  await prisma.settings.create({
    data: {
      userId: admin.id,
      fullName: defaultSettingsStore.personal.fullName,
      email: admin.email ?? DEMO_EMAIL,
      jobTitle: defaultSettingsStore.personal.jobTitle,
      department: defaultSettingsStore.personal.department,
      emailDigest: defaultSettingsStore.preferences.emailDigest,
      desktopNotifications: defaultSettingsStore.preferences.desktopNotifications,
      weeklyReport: defaultSettingsStore.preferences.weeklyReport,
      twoFactor: defaultSettingsStore.preferences.twoFactor,
    },
  })

  // --- Empty module-state shells ---
  // Shared modules use a workspace-level scope; personal modules are per-user.
  const SHARED = new Set([
    "employees", "leave", "recruitment", "projects", "goals",
    "payroll", "payslips", "performance", "onboarding", "attendance",
    "organization", "analytics", "reports", "documents",
    "announcements",
  ])
  const WORKSPACE_ID = "__workspace__"

  console.log("🗃️  Creating empty module states...")
  for (const key of MODULE_KEYS) {
    const scopeId = SHARED.has(key) ? WORKSPACE_ID : admin.id
    await prisma.moduleState.upsert({
      where: { userId_key: { userId: scopeId, key } },
      update: {},
      create: {
        userId: scopeId,
        key,
        data: MODULE_DEFAULTS[key] as object,
      },
    })
  }

  console.log("✅ Seed complete — clean workspace with 3 demo logins, no demo records.")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
