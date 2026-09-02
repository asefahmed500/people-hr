import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requirePageRole } from "@/lib/auth-guards"
import { RecruitmentPageClient } from "./recruitment-page-client"

export default async function RecruitmentPage() {
  await requirePageRole("admin")
  return (
    <DashboardShell activeHref="/recruitment" current="Recruitment" accentCurrent>
      <RecruitmentPageClient />
    </DashboardShell>
  )
}
