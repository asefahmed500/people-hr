import { ArrowRight, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ReportTemplate } from "@/lib/data"

const TEMPLATE_COLORS: { iconBg: string; iconColor: string }[] = [
  { iconBg: "bg-foreground/10", iconColor: "text-primary" },
  { iconBg: "bg-foreground/10", iconColor: "text-secondary-foreground" },
  { iconBg: "bg-foreground/10", iconColor: "text-secondary-foreground" },
  { iconBg: "bg-foreground/10", iconColor: "text-secondary-foreground" },
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
          <h2 className="text-h3">
            Templates
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            Start from a saved template or schedule
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-shadow hover:shadow-card"
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
        <span className="font-sans inline-block text-[14px] font-semibold leading-tight text-foreground">
          {template.title}
        </span>
        <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
          {template.desc}
        </span>
      </div>
      <span className="mt-1 flex items-center gap-1 font-sans text-[12px] font-semibold leading-normal text-primary">
        Build
        <ArrowRight className="size-3.5" strokeWidth={2} />
      </span>
    </button>
  )
}
