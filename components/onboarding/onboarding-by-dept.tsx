import type { OnboardingTask } from "@/lib/data"

type DeptRow = {
  label: string
  fillPct: number
  fill: string
}

const DEPT_FILLS: Record<string, string> = {
  Engineering: "bg-primary",
  Design: "bg-secondary-foreground",
  Product: "bg-primary",
  Sales: "bg-muted-foreground",
  Marketing: "bg-secondary-foreground",
  People: "bg-primary",
  Research: "bg-secondary-foreground",
  Finance: "bg-foreground",
}

export function OnboardingByDept({ tasks }: { tasks: OnboardingTask[] }) {
  const deptTasks: Record<string, { total: number; done: number }> = {}
  for (const t of tasks) {
    if (!deptTasks[t.hireDept]) deptTasks[t.hireDept] = { total: 0, done: 0 }
    deptTasks[t.hireDept].total += 1
    if (t.done) deptTasks[t.hireDept].done += 1
  }
  const depts: DeptRow[] = Object.entries(deptTasks)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([label, { total, done }]) => ({
      label,
      fillPct: total > 0 ? Math.round((done / total) * 100) : 0,
      fill: DEPT_FILLS[label] ?? "bg-primary",
    }))
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-h4">
          Onboarding by department
        </h2>
        <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
          Task completion rate per team
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {depts.map((dept) => (
          <div key={dept.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 font-sans text-[12.5px] font-medium leading-normal text-secondary-foreground">
              {dept.label}
            </span>
            <div className="flex h-1.5 flex-1 overflow-clip rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${dept.fill}`}
                style={{ width: `${dept.fillPct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-sans text-[11.5px] font-semibold leading-normal text-secondary-foreground">
              {dept.fillPct} %
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
