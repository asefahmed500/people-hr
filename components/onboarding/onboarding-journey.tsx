import { cn } from "@/lib/utils"
import { phaseMeta } from "@/lib/data"
import type { OnboardingTask, Phase } from "@/lib/data"

type HireWithTasks = {
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
      const key = task.hireInit
      if (!personMap.has(key)) {
        personMap.set(key, {
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
}

export function OnboardingJourney({ tasks = [], onToggleTask }: OnboardingJourneyProps) {
  const phases = buildPhaseData(tasks)
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-display inline-block text-[17px] font-semibold leading-normal text-[#1f2a26]">
        Onboarding journey
      </h2>
      <div className="flex flex-col">
        {phases.map((phase, idx) => (
          <PhaseRow key={phase.number} phase={phase} last={idx === phases.length - 1} onToggleTask={onToggleTask} />
        ))}
      </div>
    </div>
  )
}

function PhaseRow({ phase, last, onToggleTask }: { phase: PhaseGroup; last: boolean; onToggleTask?: (id: string) => void }) {
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
          {phase.people.map((person) => (
            <PersonCard key={person.initials + person.name} person={person} onToggleTask={onToggleTask} />
          ))}
        </div>
      </div>
    </div>
  )
}

type PersonCardProps = {
  person: HireWithTasks
  onToggleTask?: (id: string) => void
}

function PersonCard({ person, onToggleTask }: PersonCardProps) {
  const doneCount = person.tasks.filter((t) => t.done).length
  const total = person.tasks.length
  const tone = "text-[#2f6f61]"
  const avatarBg = "bg-[#2f6f611a]"
  const avatarText = "text-[#2f6f61]"
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-[#edeae3] bg-[#f6f4ef] p-2.5">
      <div className="flex items-center gap-1.5">
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
            {person.initials}
          </span>
        </div>
        <span
          className={cn(
            "font-sans inline-block text-[11.5px] font-medium leading-normal",
            tone,
          )}
        >
          {person.name}
        </span>
        <span className="font-sans inline-block text-[10.5px] leading-normal text-[#8a948d]">
          {person.role}
        </span>
        <span className="ml-auto font-sans text-[10px] text-[#8a948d]">
          {doneCount}/{total}
        </span>
      </div>
      {person.tasks.length > 0 ? (
        <div className="flex flex-col gap-1">
          {person.tasks.map((task) => (
            <TaskCheck key={task.id} task={task} onToggle={onToggleTask} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

type TaskCheckProps = {
  task: OnboardingTask
  onToggle?: (id: string) => void
}

function TaskCheck({ task, onToggle }: TaskCheckProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle?.(task.id)}
      className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left hover:bg-[#e8e3da]"
    >
      <span
        className={cn(
          "inline-flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
          task.done
            ? "border-[#2e9160] bg-[#2e9160]"
            : "border-[#c4c9c1] bg-white hover:border-[#2e9160]",
        )}
      >
        {task.done ? (
          <svg className="size-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
            <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span
        className={cn(
          "font-sans text-[11px] leading-normal",
          task.done ? "text-[#6b7770] line-through" : "text-[#42504a]",
        )}
      >
        {task.label}
      </span>
    </button>
  )
}
