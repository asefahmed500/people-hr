import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { RecruitmentPageClient } from "./recruitment-page-client"

export default function RecruitmentPage() {
  return (
    <DashboardShell activeHref="/recruitment" current="Recruitment" accentCurrent>
      <RecruitmentPageClient />
    </DashboardShell>
  )
}
