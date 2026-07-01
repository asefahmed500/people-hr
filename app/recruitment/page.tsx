import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { RecruitmentHeader } from "@/components/recruitment/recruitment-header"
import { RecruitmentKpiStrip } from "@/components/recruitment/recruitment-kpi-strip"
import { PipelineFunnelCard } from "@/components/recruitment/pipeline-funnel-card"
import { OpenRolesByDept } from "@/components/recruitment/open-roles-by-dept"
import { ConversionRateCard } from "@/components/recruitment/conversion-rate-card"
import { RecentApplicants } from "@/components/recruitment/recent-applicants"

export default function RecruitmentPage() {
  return (
    <DashboardShell activeHref="/recruitment" current="Recruitment" accentCurrent>
      <RecruitmentHeader />
      <RecruitmentKpiStrip />
      <div className="flex items-start gap-5">
        <PipelineFunnelCard />
        <div className="flex w-[360px] shrink-0 flex-col gap-5">
          <OpenRolesByDept />
          <ConversionRateCard />
        </div>
      </div>
      <RecentApplicants />
    </DashboardShell>
  )
}
