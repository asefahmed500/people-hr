import { requirePageRole } from "@/lib/auth-guards"
import { AnalyticsPageClient } from "./analytics-page-client"

export default async function AnalyticsPage() {
  await requirePageRole("admin")
  return <AnalyticsPageClient />
}
