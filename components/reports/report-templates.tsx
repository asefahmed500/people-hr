import { ArrowRight, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ReportTemplate } from "@/lib/data"

const TEMPLATE_COLORS: { iconBg: string; iconColor: string }[] = [
  { iconBg: "bg-[#2f6f611a]", iconColor: "text-[#2f6f61]" },
  { iconBg: "bg-[#64b6ac24]", iconColor: "text-[#3e9488]" },
  { iconBg: "bg-[#f4a26129]", iconColor: "text-[#d98842]" },
  { iconBg: "bg-[#3bb27326]", iconColor: "text-[#2e9160]" },
]

type ReportTemplatesProps = {
  onSelect?: (title: string) => void
  templates?: ReportTemplate[]
}

export function ReportTemplates({ onSelect, templates }: ReportTemplatesProps) {
  const items = templates ?? []
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
            Templates
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            Start from a saved template or schedule
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {items.map((template, idx) => (
          <TemplateCard
            key={template.id}
            template={template}
            colors={TEMPLATE_COLORS[idx % TEMPLATE_COLORS.length]}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

function TemplateCard({ template, colors, onSelect }: { template: ReportTemplate; colors: { iconBg: string; iconColor: string }; onSelect?: (title: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(template.title)}
      className="flex flex-col gap-3 rounded-[18px] border border-[#edeae3] bg-white p-5 text-left shadow-[0px_2px_10px_rgba(47,111,97,0.05)] transition-shadow hover:shadow-[0px_4px_14px_rgba(47,111,97,0.08)]"
    >
      <div
        className={cn(
          "flex size-[42px] items-center justify-center rounded-xl",
          colors.iconBg,
        )}
      >
        <FileText className={cn("size-5", colors.iconColor)} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-sans inline-block text-[14px] font-semibold leading-tight text-[#1f2a26]">
          {template.title}
        </span>
        <span className="font-sans inline-block text-[12px] leading-normal text-[#8a948d]">
          {template.desc}
        </span>
      </div>
      <span className="mt-1 flex items-center gap-1 font-sans text-[12px] font-semibold leading-normal text-[#2f6f61]">
        Build
        <ArrowRight className="size-3.5" strokeWidth={2} />
      </span>
    </button>
  )
}
