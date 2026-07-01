import { ArrowRight, FileText, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Template = {
  title: string
  desc: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

const templates: Template[] = [
  {
    title: "Headcount report",
    desc: "Active, on leave, new hires and exits by department",
    icon: FileText,
    iconBg: "bg-[#2f6f611a]",
    iconColor: "text-[#2f6f61]",
  },
  {
    title: "Payroll summary",
    desc: "Gross, deductions, net and employer cost by team",
    icon: FileText,
    iconBg: "bg-[#64b6ac24]",
    iconColor: "text-[#3e9488]",
  },
  {
    title: "Attendance report",
    desc: "Present, remote, absent and lateness over time",
    icon: FileText,
    iconBg: "bg-[#f4a26129]",
    iconColor: "text-[#d98842]",
  },
  {
    title: "Engagement survey",
    desc: "eNPS, sentiment scores and verbatim themes",
    icon: FileText,
    iconBg: "bg-[#3bb27326]",
    iconColor: "text-[#2e9160]",
  },
]

export function ReportTemplates() {
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
        {templates.map((template) => (
          <TemplateCard key={template.title} template={template} />
        ))}
      </div>
    </section>
  )
}

function TemplateCard({ template }: { template: Template }) {
  const Icon = template.icon
  return (
    <button
      type="button"
      className="flex flex-col gap-3 rounded-[18px] border border-[#edeae3] bg-white p-5 text-left shadow-[0px_2px_10px_rgba(47,111,97,0.05)] transition-shadow hover:shadow-[0px_4px_14px_rgba(47,111,97,0.08)]"
    >
      <div
        className={cn(
          "flex size-[42px] items-center justify-center rounded-xl",
          template.iconBg,
        )}
      >
        <Icon className={cn("size-5", template.iconColor)} strokeWidth={2} />
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
