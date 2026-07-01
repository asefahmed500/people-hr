import { cn } from "@/lib/utils"

type Balance = {
  label: string
  meta: string
  fillPct: number
  fill: string
}

const balances: Balance[] = [
  {
    label: "Vacation",
    meta: "15d used · 9d left",
    fillPct: 62,
    fill: "bg-[#2f6f61]",
  },
  {
    label: "Sick",
    meta: "6d used · 19d left",
    fillPct: 24,
    fill: "bg-[#64b6ac]",
  },
  {
    label: "Personal",
    meta: "2d used · 3d left",
    fillPct: 9,
    fill: "bg-[#f4a261]",
  },
  {
    label: "Parental",
    meta: "90d used · 60d left",
    fillPct: 6,
    fill: "bg-[#42504a]",
  },
]

export function BalanceByType() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-5 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <h2 className="font-display inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Balance by type
      </h2>
      <div className="flex flex-col gap-4">
        {balances.map((balance) => (
          <div key={balance.label} className="flex flex-col gap-[7px]">
            <div className="flex items-center justify-between">
              <span className="font-sans inline-block text-xs font-medium leading-normal text-[#1f2a26]">
                {balance.label}
              </span>
              <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
                {balance.meta}
              </span>
            </div>
            <div className="flex h-1.5 w-full rounded-full bg-[#f1eee8]">
              <div
                className={cn("h-full rounded-full", balance.fill)}
                style={{ width: `${balance.fillPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
