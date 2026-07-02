import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProjectsPageClient } from "./projects-page-client"

export default function ProjectsPage() {
  return (
    <DashboardShell activeHref="/projects" current="Projects" accentCurrent>
      <ProjectsPageClient />
    </DashboardShell>
  )
}
