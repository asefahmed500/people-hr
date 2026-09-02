import { requirePageRole } from "@/lib/auth-guards"
import { OnboardingPageClient } from "./onboarding-page-client"

export default async function OnboardingPage() {
  await requirePageRole("admin", "manager")
  return <OnboardingPageClient />
}
