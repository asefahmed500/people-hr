import { cn } from "@/lib/utils"

type Tone = "forest" | "mint" | "amber" | "teal"

type Hire = {
  initials: string
  name: string
  role: string
}

type Phase = {
  number: number
  name: string
  count: string
  nodeBg: string
  nodeText: string
  hires: Hire[]
}

const phases: Phase[] = [
  {
    number: 1,
    name: "Pre-boarding",
    count: "14 people · 24%",
    nodeBg: "bg-[#0f9b8e1a]",
    nodeText: "text-[#2f6f61]",
    hires: [
      {
        initials: "SA",
        name: "Sofia Alvarez",
        role: "Sr Product Designer",
      },
      {
        initials: "PN",
        name: "Priya Nair",
        role: "Platform Engineer",
      },
    ],
  },
  {
    number: 2,
    name: "Week 1",
    count: "22 people · 38%",
    nodeBg: "bg-[#64b6ac1a]",
    nodeText: "text-[#3e9488]",
    hires: [
      {
        initials: "DO",
        name: "Daniel Okafor",
        role: "Backend Engineer",
      },
      {
        initials: "LF",
        name: "Lena Fischer",
        role: "HR Specialist",
      },
    ],
  },
  {
    number: 3,
    name: "First month",
    count: "16 people · 28%",
    nodeBg: "bg-[#f4a26126]",
    nodeText: "text-[#b96a2c]",
    hires: [
      {
        initials: "MB",
        name: "Marcus Bailey",
        role: "Account Executive",
      },
      {
        initials: "HL",
        name: "Hana Lindqvist",
        role: "Product Manager",
      },
    ],
  },
  {
    number: 4,
    name: "Fully ramped",
    count: "6 people · 10%",
    nodeBg: "bg-[#0f9b8e1a]",
    nodeText: "text-[#2f6f61]",
    hires: [
      {
        initials: "AC",
        name: "Amara Cole",
        role: "UX Researcher",
      },
    ],
  },
]

export function OnboardingJourney() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
        Onboarding journey
      </h2>
      <div className="flex flex-col">
        {phases.map((phase, idx) => (
          <PhaseRow key={phase.number} phase={phase} last={idx === phases.length - 1} />
        ))}
      </div>
    </div>
  )
}

function PhaseRow({ phase, last }: { phase: Phase; last: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex w-7 shrink-0 flex-col items-center">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full",
            phase.nodeBg,
          )}
        >
          <span
            className={cn(
              "font-sans text-[11px] font-bold leading-none",
              phase.nodeText,
            )}
          >
            {phase.number}
          </span>
        </div>
        {!last ? (
          <div className="mx-0 mb-0 mt-1 flex min-h-14 w-0.5 flex-1 bg-[#edeae3]" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-0 pb-5 pt-0">
        <div className="flex items-center gap-2">
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
            {phase.name}
          </span>
          <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
            {phase.count}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {phase.hires.map((hire) => (
            <HireChip key={hire.initials + hire.name} hire={hire} tone={phase.nodeText} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HireChip({ hire, tone }: { hire: Hire; tone: string }) {
  const avatarBg = "bg-[#2f6f611a]"
  const avatarText = "text-[#2f6f61]"
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#edeae3] bg-[#f6f4ef] px-2.5 py-1">
      <div
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          avatarBg,
        )}
      >
        <span
          className={cn(
            "font-sans text-[9px] font-bold leading-none",
            avatarText,
          )}
        >
          {hire.initials}
        </span>
      </div>
      <span
        className={cn(
          "font-sans inline-block text-[11.5px] font-medium leading-normal",
          tone,
        )}
      >
        {hire.name}
      </span>
      <span className="font-sans inline-block text-[10.5px] leading-normal text-[#8a948d]">
        {hire.role}
      </span>
    </div>
  )
}
