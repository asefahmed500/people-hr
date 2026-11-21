import { requirePageRole } from "@/lib/auth-guards"
import { JobsPageClient } from "./jobs-page-client"

export default async function JobsPage() {
  await requirePageRole("admin")
  return <JobsPageClient />
}
