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
  CheckCircle2,
  ArrowUpRight,
  ArrowRightLeft,
  CircleSlash,
  Eye,
  HeartHandshake,
  Baby,
  UserRound,
  Banknote,
  type LucideIcon,
} from "lucide-react"

import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES, type DocumentType } from "@/lib/data/documents"
import { Button } from "@/components/ui/button"

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
  confirmation: CheckCircle2,
  promotion: ArrowUpRight,
  transfer: ArrowRightLeft,
  termination: CircleSlash,
  "show-cause": Eye,
  appreciation: HeartHandshake,
  "no-dues": FileCheck,
  maternity: Baby,
  paternity: UserRound,
  "salary-revision": Banknote,
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
  confirmation: "Confirm employment after probation",
  promotion: "Recognise a promotion and revised pay",
  transfer: "Announce an internal department move",
  termination: "Formally conclude an employment",
  "show-cause": "Request a written explanation",
  appreciation: "Recognise outstanding contribution",
  "no-dues": "Certify settlement of all dues",
  maternity: "Confirm maternity leave entitlement",
  paternity: "Confirm paternity leave entitlement",
  "salary-revision": "Communicate a revised salary",
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
          <Button
            key={type}
            type="button"
            variant="outline"
            onClick={() => onSelect(type)}
            className="h-auto min-w-0 w-full flex-col items-start gap-2 p-4 text-left font-normal"
          >
            <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted">
              <Icon className="size-4 text-secondary-foreground" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="font-sans text-[13px] font-medium leading-snug text-foreground">
              {DOCUMENT_TYPE_LABELS[type]}
            </span>
            <span className="text-[11.5px] leading-snug text-muted-foreground">
              {TYPE_DESCRIPTIONS[type]}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
