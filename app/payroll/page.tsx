import { requirePageRole } from "@/lib/auth-guards"
import { PayrollPageClient } from "./payroll-page-client"

export default async function PayrollPage() {
  await requirePageRole("admin")
  return <PayrollPageClient />
}
