"use client"

import { ChevronRight } from "lucide-react"

import type { Candidate, Opening, CandidateStage } from "@/lib/data"
import { stageMeta, stageOrder } from "@/lib/data"

type StageView = {
  name: string
  count: string
  dot: string
  fill: string
  fillPct: number
  avatarBg: string
  avatarText: string
  candidates: { name: string; role: string; initials: string }[]
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")

function buildStages(candidates: Candidate[]): StageView[] {
  const total = candidates.length || 1
  return stageOrder.map((stageKey: CandidateStage) => {
    const meta = stageMeta[stageKey]
    const inStage = candidates.filter((c) => c.stage === stageKey)
    return {
      name: meta.label,
      count: String(inStage.length),
      dot: meta.dot,
      fill: meta.fill,
      fillPct: Math.round((inStage.length / total) * 100),
      avatarBg: meta.avatarBg,
      avatarText: meta.avatarText,
      candidates: inStage.slice(0, 2).map((c) => ({
        name: c.name,
        role: c.role,
        initials: initials(c.name),
      })),
    }
  })
}

export function RecruitmentPipeline({
  candidates,
  openings,
  onOpenBoard,
}: {
  candidates?: Candidate[]
  openings?: Opening[]
  onOpenBoard?: () => void
}) {
  const stages = candidates ? buildStages(candidates) : []
  const totalCandidates = candidates?.length ?? 142
  const totalRoles = openings?.length ?? 27

  return (
    <div className="flex h-fit w-full flex-col gap-4 rounded-[18px] border border-[#ece9e2] bg-white p-6 shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
            Recruitment pipeline
          </h3>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            {totalCandidates} active candidates across {totalRoles} roles
          </p>
        </div>
        <button type="button" onClick={onOpenBoard} className="flex items-center gap-[5px]">
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

function PipelineColumn({ stage }: { stage: StageView }) {
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
          candidate={candidate}
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
  candidate: { name: string; role: string; initials: string }
  stage: StageView
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
