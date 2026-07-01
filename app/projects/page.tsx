import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProjectsHeader } from "@/components/projects/projects-header"
import { ProjectsKpiStrip } from "@/components/projects/projects-kpi-strip"
import { KanbanBoard } from "@/components/projects/kanban-board"

export default function ProjectsPage() {
  return (
    <DashboardShell activeHref="/projects" current="Projects" accentCurrent>
      <ProjectsHeader />
      <ProjectsKpiStrip />
      <KanbanBoard />
    </DashboardShell>
  )
}
