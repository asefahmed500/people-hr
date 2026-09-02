import { requirePageRole } from "@/lib/auth-guards"
import { ReportsPageClient } from "./reports-page-client"

export default async function ReportsPage() {
  await requirePageRole("admin")
  return <ReportsPageClient />
}
