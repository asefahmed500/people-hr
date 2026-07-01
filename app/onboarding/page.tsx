import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingKpiStrip } from "@/components/onboarding/onboarding-kpi-strip"
import { OnboardingJourney } from "@/components/onboarding/onboarding-journey"
import { ProgressByPhase } from "@/components/onboarding/progress-by-phase"
import { OnboardingByDept } from "@/components/onboarding/onboarding-by-dept"

export default function OnboardingPage() {
  return (
    <DashboardShell activeHref="/onboarding" current="Onboarding" accentCurrent>
      <OnboardingHeader />
      <OnboardingKpiStrip />
      <div className="flex items-start gap-5">
        <OnboardingJourney />
        <div className="flex w-[340px] shrink-0 flex-col gap-5">
          <ProgressByPhase />
          <OnboardingByDept />
        </div>
      </div>
    </DashboardShell>
  )
}
