import { Check, ChevronRight, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { phaseMeta } from "@/lib/data"
import type { OnboardingTask, Phase } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type HireWithTasks = {
  key: string
  initials: string
  name: string
  role: string
  tasks: OnboardingTask[]
}

type PhaseGroup = {
  number: number
  name: string
  count: string
  nodeBg: string
  nodeText: string
  people: HireWithTasks[]
}

function buildPhaseData(tasks: OnboardingTask[]): PhaseGroup[] {
  const phaseOrder: Phase[] = ["pre", "w1", "m1", "ramped"]
  return phaseOrder.map((phase) => {
    const phaseTasks = tasks.filter((t) => t.phase === phase)
    const meta = phaseMeta[phase]
    const personMap = new Map<string, HireWithTasks>()
    for (const task of phaseTasks) {
      // Prefer the stable employee id; fall back to name only for legacy rows.
      const key = task.employeeId ?? task.hireName
      if (!personMap.has(key)) {
        personMap.set(key, {
          key,
          initials: task.hireInit,
          name: task.hireName,
          role: task.hireRole,
          tasks: [],
        })
      }
      personMap.get(key)!.tasks.push(task)
    }
    return {
      number: meta.number,
      name: meta.name,
      count: `${phaseTasks.length} task${phaseTasks.length === 1 ? "" : "s"}`,
      nodeBg: meta.nodeBg,
      nodeText: meta.nodeText,
      people: Array.from(personMap.values()),
    }
  })
}

type OnboardingJourneyProps = {
  tasks?: OnboardingTask[]
  onToggleTask?: (id: string) => void
  onAdvanceHire?: (hireKey: string) => void
  onDeleteTask?: (id: string) => void
}

export function OnboardingJourney({
  tasks = [],
  onToggleTask,
  onAdvanceHire,
  onDeleteTask,
}: OnboardingJourneyProps) {
  const phases = buildPhaseData(tasks)
  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-h3">
          Onboarding journey
        </h2>
        <div className="flex flex-col">
          {phases.map((phase, idx) => (
            <PhaseRow
              key={phase.number}
              phase={phase}
              last={idx === phases.length - 1}
              onToggleTask={onToggleTask}
              onAdvanceHire={onAdvanceHire}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}

function PhaseRow({
  phase,
  last,
  onToggleTask,
  onAdvanceHire,
  onDeleteTask,
}: {
  phase: PhaseGroup
  last: boolean
  onToggleTask?: (id: string) => void
  onAdvanceHire?: (hireKey: string) => void
  onDeleteTask?: (id: string) => void
}) {
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
              "font-sans text-[11px] font-semibold leading-none",
              phase.nodeText,
            )}
          >
            {phase.number}
          </span>
        </div>
        {!last ? (
          <Separator orientation="vertical" className="mx-0 mb-0 mt-1 min-h-14 w-0.5 flex-1" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-0 pb-5 pt-0">
        <div className="flex items-center gap-2">
          <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-foreground">
            {phase.name}
          </span>
          <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
            {phase.count}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {phase.people.map((person) => (
            <PersonCard
              key={person.key}
              person={person}
              onToggleTask={onToggleTask}
              onAdvanceHire={onAdvanceHire}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type PersonCardProps = {
  person: HireWithTasks
  onToggleTask?: (id: string) => void
  onAdvanceHire?: (hireKey: string) => void
  onDeleteTask?: (id: string) => void
}

function PersonCard({ person, onToggleTask, onAdvanceHire, onDeleteTask }: PersonCardProps) {
  const doneCount = person.tasks.filter((t) => t.done).length
  const total = person.tasks.length
  const atEnd = person.tasks.length > 0 && person.tasks.every((t) => t.phase === "ramped")
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted p-2.5">
      <div className="flex items-center gap-1.5">
        <Avatar className="size-5">
          <AvatarFallback className="text-[9px] font-semibold">{person.initials}</AvatarFallback>
        </Avatar>
        <span className="font-sans inline-block text-[11.5px] font-medium leading-normal text-primary">
          {person.name}
        </span>
        <span className="font-sans inline-block text-[10.5px] leading-normal text-muted-foreground">
          {person.role}
        </span>
        <span className="ml-auto font-sans text-[10px] text-muted-foreground">
          {doneCount}/{total}
        </span>
        {onAdvanceHire && !atEnd ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => onAdvanceHire(person.key)}
                aria-label={`Advance ${person.name} to the next phase`}
              >
                <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Advance to next phase</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {person.tasks.length > 0 ? (
        <div className="flex flex-col gap-1">
          {person.tasks.map((task) => (
            <TaskCheck key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

type TaskCheckProps = {
  task: OnboardingTask
  onToggle?: (id: string) => void
  onDelete?: (id: string) => void
}

function TaskCheck({ task, onToggle, onDelete }: TaskCheckProps) {
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
          task.done
            ? "border-primary bg-primary"
            : "border-border bg-card hover:border-foreground",
        )}
      >
        {task.done ? (
          <Check className="size-2.5 text-primary-foreground" strokeWidth={2.5} aria-hidden="true" />
        ) : null}
      </span>
      <span
        className={cn(
          "font-sans text-[11px] leading-normal",
          task.done ? "text-secondary-foreground line-through" : "text-secondary-foreground",
        )}
      >
        {task.label}
      </span>
    </>
  )
  if (!onToggle) {
    return <div className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1">{content}</div>
  }
  return (
    <div className="group flex w-full items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        onClick={() => onToggle(task.id)}
        className="h-auto min-w-0 flex-1 justify-start gap-1.5 px-1.5 py-1 text-left hover:bg-card"
      >
        {content}
      </Button>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Delete task ${task.label}`}
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="size-3" strokeWidth={2} aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}
