import { cn } from "@/lib/utils"

const tabs = [
  { label: "Profile", active: true },
  { label: "Notifications", active: false },
  { label: "Security", active: false },
  { label: "Billing", active: false },
  { label: "Team", active: false },
]

export function SettingsTabBar() {
  return (
    <div className="flex h-fit gap-1 border-b border-b-[#e8ebe6]">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={cn(
            "mx-0 mb-[-1px] mt-0 flex items-center px-3.5 py-2.5",
            tab.active && "border-b-2 border-b-[#2f6f61]",
          )}
        >
          <span
            className={cn(
              "font-sans inline-block text-[13.5px] leading-normal",
              tab.active
                ? "font-semibold text-[#2f6f61]"
                : "font-medium text-[#5b655e]",
            )}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
