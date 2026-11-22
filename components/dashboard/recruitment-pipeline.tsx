"use client"

import { ChevronRight } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

// Keep each stage's bar colour while using the shared Progress primitive.
const progressFill: Record<string, string> = {
  "bg-primary": "[&_[data-slot=progress-indicator]]:bg-primary",
  "bg-secondary-foreground": "[&_[data-slot=progress-indicator]]:bg-secondary-foreground",
  "bg-muted-foreground": "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
  "bg-foreground": "[&_[data-slot=progress-indicator]]:bg-foreground",
}

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
  const totalCandidates = candidates?.length ?? 0
  const totalRoles = openings?.length ?? 0

  return (
    <div className="flex h-fit w-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[3px]">
          <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
            Recruitment pipeline
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-muted-foreground">
            {totalCandidates} active candidates across {totalRoles} roles
          </p>
        </div>
        {onOpenBoard ? (
          <Button type="button" variant="link" size="sm" onClick={onOpenBoard} className="gap-1">
            Open board
            <ChevronRight className="button-arrow size-3.5" strokeWidth={2} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="flex gap-3.5 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <PipelineColumn key={stage.name} stage={stage} />
        ))}
      </div>
    </div>
  )
}

function PipelineColumn({ stage }: { stage: StageView }) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 rounded-lg border border-border bg-muted p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <span className={`size-2 rounded-full ${stage.dot}`} />
          <span className="font-sans inline-block text-[12.5px] font-semibold leading-normal text-foreground">
            {stage.name}
          </span>
        </div>
        <span className="font-sans inline-block text-xs font-semibold leading-normal text-muted-foreground">
          {stage.count}
        </span>
      </div>
      <Progress
        value={stage.fillPct}
        aria-label={`${stage.name}: ${stage.count} candidates`}
        className={cn("h-[5px]", progressFill[stage.fill])}
      />
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
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
      <Avatar className={cn("size-6", stage.avatarBg)}>
        <AvatarFallback
          className={cn(
            "bg-transparent font-sans text-[10px] font-semibold leading-normal",
            stage.avatarText,
          )}
        >
          {candidate.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="inline-block overflow-clip font-sans text-[11px] font-semibold leading-[1.2] text-foreground [text-overflow:ellipsis]">
          {candidate.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[9.5px] leading-[1.2] text-muted-foreground [text-overflow:ellipsis]">
          {candidate.role}
        </span>
      </div>
    </div>
  )
}
