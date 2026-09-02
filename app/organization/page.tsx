import { requirePageRole } from "@/lib/auth-guards"
import { OrganizationPageClient } from "./organization-page-client"

export default async function OrganizationPage() {
  await requirePageRole("admin")
  return <OrganizationPageClient />
}
