import type { Opening } from "@/lib/data"

export function OpenRolesByDept({ openings }: { openings: Opening[] }) {
  const byDept = openings.reduce<Record<string, number>>((acc, o) => {
    acc[o.department] = (acc[o.department] ?? 0) + 1
    return acc
  }, {})
  const rows = Object.entries(byDept).map(([name, count]) => ({ name, count }))
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <h2 className="font-display inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Open roles by department
      </h2>
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#edeae3] bg-[#faf9f6] px-4 py-6 text-center font-sans text-[12.5px] text-[#8a948d]">
            No open roles yet.
          </div>
        ) : null}
        {rows.map((row) => (
          <div key={row.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold leading-normal text-[#1f2a26]">
                {row.name}
              </span>
              <span className="font-sans text-[11px] leading-normal text-[#8a948d]">
                {row.count} open
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-clip rounded-full bg-[#edeae3]">
              <div
                className="h-full rounded-full bg-[#2f6f61]"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {openings.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-t-[#f1eee8] pt-3">
          {openings.slice(0, 4).map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[#faf9f6]"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-sans text-[12.5px] font-medium text-[#1f2a26]">
                  {o.title}
                </span>
                <span className="font-sans text-[11px] text-[#8a948d]">
                  {o.department} · {o.location} · {o.applicants} applicants
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
