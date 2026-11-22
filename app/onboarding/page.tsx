import { requirePageRole } from "@/lib/auth-guards"
import { OnboardingPageClient } from "./onboarding-page-client"

export default async function OnboardingPage() {
  // Employees can view their own onboarding checklist. The store route already
  // self-scopes the tasks and the merge keeps employee writes read-only.
  await requirePageRole()
  return <OnboardingPageClient />
}
