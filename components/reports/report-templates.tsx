import { ArrowRight, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ReportTemplate } from "@/lib/data"
import { Button } from "@/components/ui/button"

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
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-[12.5px] leading-normal text-muted-foreground">
          No templates yet. Create a scheduled report to get started.
        </p>
      ) : (
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
      )}
    </section>
  )
}

function TemplateCard({ template, colors, onSelect }: { template: ReportTemplate; colors: { iconBg: string; iconColor: string }; onSelect?: (title: string) => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onSelect?.(template.title)}
      className="h-auto min-w-0 w-full flex-col items-start gap-3 p-4 text-left font-normal"
    >
      <div
        className={cn(
          "flex size-[42px] items-center justify-center rounded-lg",
          colors.iconBg,
        )}
      >
        <FileText className={cn("size-5", colors.iconColor)} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-sans inline-block text-[14px] font-semibold leading-tight text-foreground">
          {template.title}
        </span>
        <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
          {template.desc}
        </span>
      </div>
      <span className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-primary">
        Build
        <ArrowRight className="button-arrow size-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
    </Button>
  )
}
