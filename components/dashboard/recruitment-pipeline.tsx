import { ChevronRight } from "lucide-react"

type Candidate = {
  name: string
  role: string
  initials: string
}

type Stage = {
  name: string
  count: string
  dot: string
  fill: string
  fillPct: number
  avatarBg: string
  avatarText: string
  candidates: Candidate[]
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")

const stages: Stage[] = [
  {
    name: "Applied",
    count: "64",
    dot: "bg-[#7ba88c]",
    fill: "bg-[#7ba88c]",
    fillPct: 100,
    avatarBg: "bg-[#7ba88c33]",
    avatarText: "text-[#548468]",
    candidates: [
      { name: "Rhea Watson", role: "Data Analyst", initials: "" },
      { name: "Jonas Meyer", role: "QA Engineer", initials: "" },
    ],
  },
  {
    name: "Screening",
    count: "38",
    dot: "bg-[#64b6ac]",
    fill: "bg-[#64b6ac]",
    fillPct: 59,
    avatarBg: "bg-[#64b6ac33]",
    avatarText: "text-[#3e9488]",
    candidates: [
      { name: "Amara Cole", role: "UX Researcher", initials: "" },
      { name: "Diego Park", role: "iOS Engineer", initials: "" },
    ],
  },
  {
    name: "Interview",
    count: "22",
    dot: "bg-[#2f6f61]",
    fill: "bg-[#2f6f61]",
    fillPct: 34,
    avatarBg: "bg-[#2f6f6133]",
    avatarText: "text-[#2f6f61]",
    candidates: [
      { name: "Hana Lindqvist", role: "Product Manager", initials: "" },
      { name: "Omar Bassett", role: "Frontend Engineer", initials: "" },
    ],
  },
  {
    name: "Offer",
    count: "11",
    dot: "bg-[#f4a261]",
    fill: "bg-[#f4a261]",
    fillPct: 17,
    avatarBg: "bg-[#f4a26133]",
    avatarText: "text-[#c67934]",
    candidates: [
      { name: "Nadia Khan", role: "Finance Lead", initials: "" },
      { name: "Elias Roth", role: "DevOps Engineer", initials: "" },
    ],
  },
  {
    name: "Hired",
    count: "7",
    dot: "bg-[#3bb273]",
    fill: "bg-[#3bb273]",
    fillPct: 11,
    avatarBg: "bg-[#3bb27333]",
    avatarText: "text-[#2e9160]",
    candidates: [
      { name: "Sofia Alvarez", role: "Product Designer", initials: "" },
      { name: "Daniel Okafor", role: "Backend Engineer", initials: "" },
    ],
  },
]

export function RecruitmentPipeline() {
  return (
    <div className="flex h-fit w-full flex-col gap-4 rounded-[18px] border border-[#ece9e2] bg-white p-6 shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
            Recruitment pipeline
          </h3>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            142 active candidates across 27 roles
          </p>
        </div>
        <button type="button" className="flex items-center gap-[5px]">
          <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-[#2f6f61]">
            Open board
          </span>
          <ChevronRight className="size-[15px] text-[#2f6f61]" strokeWidth={2} />
        </button>
      </div>
      <div className="flex gap-3.5">
        {stages.map((stage) => (
          <PipelineColumn key={stage.name} stage={stage} />
        ))}
      </div>
    </div>
  )
}

function PipelineColumn({ stage }: { stage: Stage }) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 rounded-[14px] border border-[#efede6] bg-[#f8f7f4] p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <span className={`size-2 rounded-full ${stage.dot}`} />
          <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-[#1f2a26]">
            {stage.name}
          </span>
        </div>
        <span className="font-sans inline-block text-xs font-semibold leading-normal text-[#8a948d]">
          {stage.count}
        </span>
      </div>
      <div className="flex h-[5px] w-full overflow-clip rounded-full bg-[#eae7e0]">
        <div
          className={`h-full rounded-full ${stage.fill}`}
          style={{ width: `${stage.fillPct}%` }}
        />
      </div>
      {stage.candidates.map((candidate) => (
        <CandidateCard
          key={candidate.name}
          candidate={{
            ...candidate,
            initials: initials(candidate.name),
          }}
          stage={stage}
        />
      ))}
    </div>
  )
}

function CandidateCard({
  candidate,
  stage,
}: {
  candidate: Candidate
  stage: Stage
}) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[#efede6] bg-white p-2">
      <div
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${stage.avatarBg}`}
      >
        <span
          className={`font-sans text-[10px] font-bold leading-normal ${stage.avatarText}`}
        >
          {candidate.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="inline-block overflow-clip font-sans text-[11px] font-semibold leading-[1.2] text-[#1f2a26] [text-overflow:ellipsis]">
          {candidate.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[9.5px] leading-[1.2] text-[#a6aca3] [text-overflow:ellipsis]">
          {candidate.role}
        </span>
      </div>
    </div>
  )
}
