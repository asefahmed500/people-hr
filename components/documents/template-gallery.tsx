"use client"

import {
  FileSignature,
  Mail,
  BadgeCheck,
  LogOut,
  GraduationCap,
  Receipt,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES, type DocumentType } from "@/lib/data/documents"

const TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  appointment: FileSignature,
  offer: Mail,
  experience: BadgeCheck,
  relieving: LogOut,
  internship: GraduationCap,
  "salary-certificate": Receipt,
  "employment-verification": ShieldCheck,
  noc: FileCheck,
  warning: AlertTriangle,
  appraisal: TrendingUp,
}

const TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  appointment: "Confirm a new hire's role, start date and compensation",
  offer: "Extend a formal offer to a candidate",
  experience: "Certify a former employee's tenure",
  relieving: "Confirm resignation and last working day",
  internship: "Certificate for completed internships",
  "salary-certificate": "Proof of employment and monthly salary",
  "employment-verification": "Verify current employment status",
  noc: "No objection for external activities",
  warning: "Formal first-level disciplinary notice",
  appraisal: "Communicate promotion or revised pay",
}

type TemplateGalleryProps = {
  onSelect: (type: DocumentType) => void
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {DOCUMENT_TYPES.map((type) => {
        const Icon = TYPE_ICONS[type]
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-colors hover:bg-muted/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-gradient-to-b from-white to-[#ececea] dark:from-[#262626] dark:to-[#1c1c1c]">
              <Icon className="size-4 text-secondary-foreground" strokeWidth={2} />
            </span>
            <span className="font-sans text-[13px] font-medium leading-snug text-foreground">
              {DOCUMENT_TYPE_LABELS[type]}
            </span>
            <span className="font-sans text-[11.5px] leading-snug text-muted-foreground">
              {TYPE_DESCRIPTIONS[type]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
