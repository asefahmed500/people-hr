import { requirePageRole } from "@/lib/auth-guards"

import { PayslipsPageClient } from "./payslips-page-client"

export default async function PayslipsPage() {
  await requirePageRole("admin", "manager", "employee")
  return <PayslipsPageClient />
}
