import { Check, Ellipsis } from "lucide-react"

type Leave = {
  name: string
  reason: string
  avatar: string
}

const leaves: Leave[] = [
  {
    name: "Marcus Bailey",
    reason: "Annual · 4 days",
    avatar:
      "https://cdn.wonder.so/images/019f1be0-721c-7d40-adbe-a93f94ec931a/a72d4ad28ac6495050c66d454d65cc4bd84fac025faccd798af31909876920b5.jpg",
  },
  {
    name: "Priya Nair",
    reason: "Sick · 1 day",
    avatar:
      "https://cdn.wonder.so/images/019f1be0-721c-7d40-adbe-a93f94ec931a/a0d4f404d8ff75c958a951f5be03ecf5db53b7ddaeb8b459e398e01c512bb44e.jpg",
  },
  {
    name: "Tomas Vidal",
    reason: "Parental · 10 days",
    avatar:
      "https://cdn.wonder.so/images/019f1be0-721c-7d40-adbe-a93f94ec931a/69460ccfe152e26afc3364d6c4e7b87a17aa95eb758e0e151f669232ad54b4bb.jpg",
  },
]

export function LeaveRequests() {
  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-[18px] border border-[#ece9e2] bg-white p-[22px] shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Leave requests
        </h3>
        <span className="inline-block rounded-full bg-[#f4a26129] px-2 py-[3px] font-sans text-[11px] font-semibold leading-normal text-[#d98842]">
          5 pending
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {leaves.map((leave, idx) => (
          <LeaveRow key={idx} leave={leave} />
        ))}
      </div>
    </div>
  )
}

function LeaveRow({ leave }: { leave: Leave }) {
  return (
    <div className="flex items-center gap-[11px]">
      <div
        className="size-9 shrink-0 rounded-full bg-cover bg-no-repeat"
        style={{ backgroundImage: `url('${leave.avatar}')` }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
          {leave.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[11.5px] leading-normal text-[#8a948d] [text-overflow:ellipsis]">
          {leave.reason}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Approve ${leave.name}`}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#3bb2731f]"
      >
        <Check className="size-[15px] text-[#2e9160]" strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label={`More options for ${leave.name}`}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#f3f1ec]"
      >
        <Ellipsis className="size-[15px] text-[#8a948d]" strokeWidth={2} />
      </button>
    </div>
  )
}
