import { cn } from "@/lib/utils"

type Pref = {
  label: string
  desc: string
  on: boolean
}

const prefs: Pref[] = [
  {
    label: "Email digest",
    desc: "Receive a daily summary of workspace activity",
    on: true,
  },
  {
    label: "Desktop notifications",
    desc: "Show browser notifications for mentions and tasks",
    on: true,
  },
  {
    label: "Weekly report",
    desc: "Receive a weekly summary every Monday morning",
    on: false,
  },
  {
    label: "Two-factor authentication",
    desc: "Add an extra layer of security to your account",
    on: true,
  },
]

export function PreferencesCard() {
  return (
    <div className="flex flex-col rounded-[14px] border border-[#e8ebe6] bg-white p-6">
      <h2 className="mx-0 mb-4 mt-0 font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Preferences
      </h2>
      {prefs.map((pref, idx) => (
        <PrefRow key={pref.label} pref={pref} last={idx === prefs.length - 1} />
      ))}
    </div>
  )
}

function PrefRow({ pref, last }: { pref: Pref; last: boolean }) {
  return (
    <div
      className={cn(
        "flex h-fit items-center justify-between px-0 py-3.5",
        !last && "border-b border-b-[#f0f2ef]",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-sans inline-block text-[13.5px] font-medium leading-normal text-[#1f2a26]">
          {pref.label}
        </span>
        <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
          {pref.desc}
        </span>
      </div>
      <Toggle on={pref.on} />
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[22px] w-10 shrink-0 items-center rounded-full px-[3px] py-0",
        on ? "justify-end bg-[#2f6f61]" : "justify-start bg-[#d7ddd5]",
      )}
    >
      <span className="size-4 shrink-0 rounded-full bg-white" />
    </span>
  )
}
