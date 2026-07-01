import { cn } from "@/lib/utils"

type Status =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"

type Applicant = {
  initials: string
  name: string
  role: string
  appliedAt: string
  status: Status
}

const statusStyles: Record<Status, { bg: string; text: string; label: string }> = {
  applied: { bg: "bg-[#e0663d]", text: "text-white", label: "Applied" },
  screening: {
    bg: "bg-[#e67b58]",
    text: "text-white",
    label: "Screening",
  },
  interview: { bg: "bg-[#eb9072]", text: "text-white", label: "Interview" },
  offer: {
    bg: "bg-[#e0663d1a]",
    text: "text-[#e0663d]",
    label: "Offer",
  },
  hired: { bg: "bg-[#e0663d]", text: "text-white", label: "Hired" },
  rejected: {
    bg: "bg-[#c4553a]",
    text: "text-white",
    label: "Rejected",
  },
}

const applicants: Applicant[] = [
  {
    initials: "SA",
    name: "Sofia Alvarez",
    role: "Sr Product Designer",
    appliedAt: "Applied 2d ago",
    status: "interview",
  },
  {
    initials: "DO",
    name: "Daniel Okafor",
    role: "Backend Engineer",
    appliedAt: "Applied 3d ago",
    status: "screening",
  },
  {
    initials: "MB",
    name: "Marcus Bailey",
    role: "Account Executive",
    appliedAt: "Applied 4d ago",
    status: "interview",
  },
  {
    initials: "PN",
    name: "Priya Nair",
    role: "Platform Engineer",
    appliedAt: "Applied 5d ago",
    status: "offer",
  },
  {
    initials: "LF",
    name: "Lena Fischer",
    role: "People Partner",
    appliedAt: "Applied 1w ago",
    status: "hired",
  },
  {
    initials: "HL",
    name: "Hana Lindqvist",
    role: "Growth Marketer",
    appliedAt: "Applied 1w ago",
    status: "rejected",
  },
]

export function RecentApplicants() {
  return (
    <div className="flex w-full flex-col overflow-clip rounded-[18px] border border-[#edeae3] bg-white">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
            Recent applicants
          </h2>
          <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
            6 new this week
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 px-6 pb-6 pt-0">
        {applicants.map((applicant) => (
          <ApplicantChip key={applicant.initials + applicant.name} applicant={applicant} />
        ))}
      </div>
    </div>
  )
}

function ApplicantChip({ applicant }: { applicant: Applicant }) {
  const s = statusStyles[applicant.status]
  return (
    <div className="flex min-w-[240px] flex-1 flex-col gap-3 rounded-[14px] border border-[#edeae3] bg-[#faf9f6] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e0663d]">
          <span className="font-sans text-[11px] font-bold leading-normal text-white">
            {applicant.initials}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
            {applicant.name}
          </span>
          <span className="inline-block overflow-clip font-sans text-[11px] leading-normal text-[#6b7770] [text-overflow:ellipsis]">
            {applicant.role}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
          {applicant.appliedAt}
        </span>
        <span
          className={cn(
            "inline-block rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold leading-normal",
            s.bg,
            s.text,
          )}
        >
          {s.label}
        </span>
      </div>
    </div>
  )
}
