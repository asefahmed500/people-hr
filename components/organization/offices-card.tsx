import { cn } from "@/lib/utils"
import type { Office } from "@/lib/data"

type OfficesCardProps = {
  offices?: Office[]
}

export function OfficesCard({ offices = [] }: OfficesCardProps) {
  const total = offices.reduce((s, o) => s + o.count, 0)
  return (
    <div className="flex w-full flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-6 shadow-[0px_2px_10px_rgba(47,111,97,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-display inline-block text-lg font-semibold leading-normal text-[#1f2a26]">
            Offices &amp; locations
          </h2>
          <p className="font-sans inline-block text-[12.5px] leading-normal text-[#8a948d]">
            Headcount distribution across {offices.length} locations
          </p>
        </div>
        <span className="rounded-full bg-[#f1efea] px-3 py-1 font-sans text-[12.5px] font-semibold leading-normal text-[#42504a]">
          {total.toLocaleString()} people
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {offices.map((office, idx) => (
          <OfficeRow key={office.city} office={office} last={idx === offices.length - 1} />
        ))}
      </div>
    </div>
  )
}

function OfficeRow({ office, last }: { office: Office; last: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-0 py-2.5",
        !last && "border-b border-b-[#f5f2ec]",
      )}
    >
      <div className="flex w-[168px] flex-col">
        <span className="font-sans inline-block text-[13.5px] font-semibold leading-normal text-[#1f2a26]">
          {office.city}
        </span>
        <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
          {office.country}
        </span>
      </div>
      <div className="flex h-2 flex-1 overflow-clip rounded-full bg-[#f1eee8]">
        <div
          className={cn("h-full rounded-full", office.fill)}
          style={{ width: `${office.fillPct}%` }}
        />
      </div>
      <span className="w-[52px] text-right font-sans text-[13px] font-semibold leading-normal text-[#42504a]">
        {office.count}
      </span>
    </div>
  )
}
