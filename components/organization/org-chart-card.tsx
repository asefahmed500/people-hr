import { cn } from "@/lib/utils"
import { ChevronRight, Workflow } from "lucide-react"
import type { OrgNode } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type OrgChartCardProps = {
  expanded?: boolean
  onExpand?: () => void
  orgChart?: OrgNode[]
}

export function OrgChartCard({ expanded, onExpand, orgChart = [] }: OrgChartCardProps) {
  const ceo = orgChart.find((n) => n.isCeo)
  const nonCeo = orgChart.filter((n) => !n.isCeo)
  const visible = nonCeo.slice(0, 4)
  const extra = nonCeo.slice(4)

  if (!ceo) {
    return (
      <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">Organization chart</h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Leadership and reporting lines
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
          <Workflow className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
          <p className="font-sans text-[13px] font-semibold text-foreground">No leadership data yet</p>
          <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
            Add people with reporting lines to build the chart.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">
            Organization chart
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Leadership and reporting lines
          </p>
        </div>
        {extra.length > 0 && (
          <Button type="button" variant="link" size="sm" onClick={onExpand} className="gap-1.5">
            {expanded ? "Collapse" : "Expand full chart"}
            <ChevronRight className={cn("size-[15px] transition-transform", expanded && "rotate-90")} strokeWidth={2} aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="flex w-full flex-col items-center px-0 pb-1 pt-2">
        <CeoNode node={ceo} />
        <Separator orientation="vertical" className="h-[26px] w-0.5" />
        <Separator className="h-0.5 w-[76%]" />
        <div className="flex w-full items-start justify-center gap-4 overflow-x-auto pb-2">
          {visible.map((exec) => (
            <ExecBranch key={exec.initials} node={exec} />
          ))}
        </div>
        {expanded && extra.length > 0 && (
          <>
            <Separator orientation="vertical" className="mt-5 h-[26px] w-0.5" />
            <Separator className="h-0.5 w-[60%]" />
            <div className="mt-0 flex w-full items-start justify-center gap-4 overflow-x-auto pb-2">
              {extra.map((exec) => (
                <ExecBranch key={exec.initials} node={exec} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CeoNode({ node }: { node: OrgNode }) {
  return (
    <div className="flex w-[210px] flex-col items-center gap-1.5 rounded-lg bg-primary px-4 py-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-white/20 text-[13px] font-semibold text-primary-foreground">
          {node.initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-sans inline-block text-sm font-semibold leading-normal text-primary-foreground">
        {node.name}
      </span>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-primary-foreground/70">
        {node.role}
      </span>
    </div>
  )
}

function ExecBranch({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center">
      <Separator orientation="vertical" className="h-5 w-0.5" />
      <div className="flex w-[196px] flex-col items-center gap-1.5 rounded-lg border border-border bg-muted px-4 py-3">
        <Avatar className="size-[38px]">
          <AvatarFallback className="text-[12.5px] font-semibold">{node.initials}</AvatarFallback>
        </Avatar>
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
          {node.name}
        </span>
        <span className="font-sans inline-block text-center text-[11px] leading-normal text-muted-foreground">
          {node.role}
        </span>
      </div>
    </div>
  )
}
