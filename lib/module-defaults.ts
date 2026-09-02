// Server-side default state per module key.
// Used for seed-on-read (new users) and by the seed script for the demo user.
// Only imported from route handlers (server) and the seed script.

import { defaultEmployees } from "./data/employees"
import { defaultLeaveStore } from "./data/leave"
import { defaultRecruitmentStore } from "./data/recruitment"
import { defaultProjectsStore } from "./data/projects"
import { defaultGoalsStore } from "./data/goals"
import { defaultPayrollStore } from "./data/payroll"
import { defaultPerformanceStore } from "./data/performance"
import { defaultOnboardingStore } from "./data/onboarding"
import { defaultCheckIns } from "./data/attendance"
import { defaultOrganizationStore } from "./data/organization"
import { defaultSettingsStore } from "./data/settings"
import { defaultAnalyticsStore } from "./data/analytics"
import { defaultReportsStore } from "./data/reports"
import { defaultAssistantStore } from "./data/assistant"
import { defaultDocumentsStore } from "./data/documents"
import { defaultAnnouncementsStore } from "./data/announcements"

export const MODULE_DEFAULTS: Record<string, unknown> = {
  employees: defaultEmployees,
  leave: defaultLeaveStore,
  recruitment: defaultRecruitmentStore,
  projects: defaultProjectsStore,
  goals: defaultGoalsStore,
  payroll: defaultPayrollStore,
  performance: defaultPerformanceStore,
  onboarding: defaultOnboardingStore,
  attendance: { checkIns: defaultCheckIns },
  organization: defaultOrganizationStore,
  settings: defaultSettingsStore,
  analytics: defaultAnalyticsStore,
  reports: defaultReportsStore,
  assistant: defaultAssistantStore,
  documents: defaultDocumentsStore,
  announcements: defaultAnnouncementsStore,
}

export const MODULE_KEYS = Object.keys(MODULE_DEFAULTS)
