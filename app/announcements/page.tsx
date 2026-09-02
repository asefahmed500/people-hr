import { requirePageRole } from "@/lib/auth-guards"
import { AnnouncementsPageClient } from "./announcements-page-client"

export default async function AnnouncementsPage() {
  await requirePageRole()
  return <AnnouncementsPageClient />
}
