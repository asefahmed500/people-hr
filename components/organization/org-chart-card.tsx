import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { OrgNode } from "@/lib/data"

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

  if (!ceo) return null

  return (
    <div className="flex w-full flex-col gap-6 rounded-[18px] border border-[#edeae3] bg-white p-6 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-lg font-semibold leading-normal text-[#1f2a26]">
            Organization chart
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            Leadership and reporting lines
          </p>
        </div>
        {extra.length > 0 && (
          <button type="button" onClick={onExpand} className="flex items-center gap-1.5">
            <span className="font-sans inline-block text-[13px] font-semibold leading-normal text-[#2f6f61]">
              {expanded ? "Collapse" : "Expand full chart"}
            </span>
            <ChevronRight className={cn("size-[15px] text-[#2f6f61] transition-transform", expanded && "rotate-90")} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="flex w-full flex-col items-center px-0 pb-1 pt-2">
        <CeoNode node={ceo} />
        <span className="flex h-[26px] w-0.5 flex-col bg-[#e3ded4]" />
        <span className="flex h-0.5 w-[76%] flex-col bg-[#e3ded4]" />
        <div className="flex w-full items-start justify-center gap-5">
          {visible.map((exec) => (
            <ExecBranch key={exec.initials} node={exec} />
          ))}
        </div>
        {expanded && extra.length > 0 && (
          <>
            <span className="mt-5 flex h-[26px] w-0.5 flex-col bg-[#e3ded4]" />
            <span className="flex h-0.5 w-[60%] flex-col bg-[#e3ded4]" />
            <div className="mt-0 flex w-full items-start justify-center gap-5">
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
    <div className="flex w-[210px] flex-col items-center gap-1.5 rounded-[14px] bg-[#2f6f61] px-5 py-3.5 shadow-[0px_8px_22px_rgba(47,111,97,0.22)]">
      <div className="flex size-10 items-center justify-center rounded-full bg-[#ffffff33]">
        <span className="font-sans text-[13px] font-bold leading-normal text-white">
          {node.initials}
        </span>
      </div>
      <span className="font-sans inline-block text-sm font-semibold leading-normal text-white">
        {node.name}
      </span>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-[#bfe3db]">
        {node.role}
      </span>
    </div>
  )
}

function ExecBranch({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-5 w-0.5 flex-col bg-[#e3ded4]" />
      <div className="flex w-[196px] flex-col items-center gap-1.5 rounded-[14px] border border-[#edeae3] bg-[#faf9f6] px-4 py-3.5">
        <div className="flex size-[38px] items-center justify-center rounded-full bg-[#2f6f611f]">
          <span className="font-sans text-[12.5px] font-bold leading-normal text-[#2f6f61]">
            {node.initials}
          </span>
        </div>
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
          {node.name}
        </span>
        <span className="font-sans inline-block text-center text-[11px] leading-normal text-[#8a948d]">
          {node.role}
        </span>
      </div>
    </div>
  )
}
