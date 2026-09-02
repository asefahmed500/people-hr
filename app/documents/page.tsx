import { requirePageRole } from "@/lib/auth-guards"
import { DocumentsPageClient } from "./documents-page-client"

export default async function DocumentsPage() {
  await requirePageRole("admin")
  return <DocumentsPageClient />
}
