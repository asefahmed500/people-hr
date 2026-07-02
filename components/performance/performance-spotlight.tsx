import type { Review } from "@/lib/data"

type PerformanceSpotlightProps = {
  reviews?: Review[]
}

export function PerformanceSpotlight({ reviews = [] }: PerformanceSpotlightProps) {
  const total = reviews.length
  const ratings = reviews.map((r) => r.rating)
  const avg = total ? ratings.reduce((a, b) => a + b, 0) / total : 0
  const belowCount = reviews.filter((r) => r.status === "below" || r.status === "needs").length

  return (
    <div className="flex w-full gap-5">
      <SpotlightCard avg={avg} total={total} />
      <div className="flex w-[300px] shrink-0 flex-col gap-4">
        <MetricCardComponent
          iconBg="bg-[#6d5ce71a]"
          iconColor="text-[#6d5ce7]"
          label="Avg rating"
          value={avg.toFixed(1)}
          delta="(+0.3)"
          deltaColor="text-[#6d5ce7]"
          sub="Company-wide average"
          star="purple"
        />
        <MetricCardComponent
          iconBg="bg-[#e76f5120]"
          iconColor="text-[#c4553a]"
          label="Below expectations"
          value={String(belowCount)}
          delta="(-2)"
          deltaColor="text-[#2e9160]"
          sub="Needs improvement & below"
          star="coral"
        />
      </div>
    </div>
  )
}

function SpotlightCard({ avg, total }: { avg: number; total: number }) {
  return (
    <div className="flex flex-1 flex-col gap-6 rounded-[18px] border border-[#6d5ce733] bg-[#6d5ce71a] p-7">
      <div className="flex flex-col gap-2">
        <span className="font-sans inline-block text-[11px] font-bold uppercase leading-normal tracking-[0.8px] text-[#6d5ce7]">
          Q1 2025 · Cycle snapshot
        </span>
        <span className="font-display inline-block text-[64px] font-bold leading-none text-[#6d5ce7]">
          {total}%
        </span>
        <span className="font-sans inline-block text-base font-medium text-[#1f2a26]">
          Review cycle complete
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubStat value={avg.toFixed(1)} label="Avg rating" />
        <SubStat value={String(total)} label="Reviews submitted" />
        <SubStat value="+12%" label="vs last cycle" />
      </div>
    </div>
  )
}

function SubStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#6d5ce71f] bg-white px-3 py-1.5 shadow">
      <span className="font-display inline-block text-sm font-bold leading-normal text-[#6d5ce7]">
        {value}
      </span>
      <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
        {label}
      </span>
    </div>
  )
}

function MetricCardComponent({
  iconBg,
  iconColor,
  label,
  value,
  delta,
  deltaColor,
  sub,
  star,
}: {
  iconBg: string
  iconColor: string
  label: string
  value: string
  delta: string
  deltaColor: string
  sub: string
  star?: "purple" | "coral"
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-[18px] border border-[#e8ebe6] bg-white p-5 shadow-[0px_2px_10px_rgba(109,92,231,0.03)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-[42px] shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {star === "purple" ? (
            <StarIcon className={`size-5 ${iconColor}`} />
          ) : (
            <UserMinusIcon className={`size-5 ${iconColor}`} />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display inline-block text-[26px] font-semibold leading-none text-[#1f2a26]">
              {value}
            </span>
            <span
              className={`font-sans inline-block text-xs font-semibold leading-normal ${deltaColor}`}
            >
              {delta}
            </span>
          </div>
        </div>
      </div>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
        {sub}
      </span>
    </div>
  )
}

function StarIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function UserMinusIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h3.5" />
      <path d="M22 22l-5-5" />
      <path d="M17 22l5-5" />
    </svg>
  )
}
