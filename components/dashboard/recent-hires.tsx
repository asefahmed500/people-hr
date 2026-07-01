type Hire = {
  name: string
  role: string
  date: string
  avatar: string
}

const hires: Hire[] = [
  {
    name: "Sofia Alvarez",
    role: "Product Designer",
    date: "2d ago",
    avatar:
      "https://cdn.wonder.so/images/019f1be0-721c-7d40-adbe-a93f94ec931a/a10433c6b30dd30531abb89be6cee677995655f089121b8507aa6ae844cac161.jpg",
  },
  {
    name: "Daniel Okafor",
    role: "Backend Engineer",
    date: "3d ago",
    avatar:
      "https://cdn.wonder.so/images/019f1be0-721c-7d40-adbe-a93f94ec931a/67978a6b53666e24e83b8bd712c4ac3b559a6c90138fdae90b67fc0541aa8da8.jpg",
  },
  {
    name: "Lena Fischer",
    role: "HR Specialist",
    date: "5d ago",
    avatar:
      "https://cdn.wonder.so/images/019f1be0-721c-7d40-adbe-a93f94ec931a/15a701fde291c2600e130080611b3c54751641b4bb03d6d5c69d6f48900fa474.jpg",
  },
]

export function RecentHires() {
  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-[18px] border border-[#ece9e2] bg-white p-[22px] shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <div className="flex items-center justify-between">
        <h3 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Recent hires
        </h3>
        <span className="font-sans inline-block text-xs font-semibold leading-normal text-[#2f6f61]">
          View all
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {hires.map((hire, idx) => (
          <HireRow key={idx} hire={hire} />
        ))}
      </div>
    </div>
  )
}

function HireRow({ hire }: { hire: Hire }) {
  return (
    <div className="flex items-center gap-[11px]">
      <div
        className="size-9 shrink-0 rounded-full bg-cover bg-no-repeat"
        style={{ backgroundImage: `url('${hire.avatar}')` }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-block overflow-clip font-sans text-[13px] font-semibold leading-normal text-[#1f2a26] [text-overflow:ellipsis]">
          {hire.name}
        </span>
        <span className="inline-block overflow-clip font-sans text-[11.5px] leading-normal text-[#8a948d] [text-overflow:ellipsis]">
          {hire.role}
        </span>
      </div>
      <span className="shrink-0 font-sans text-[11px] leading-normal text-[#a6aca3]">
        {hire.date}
      </span>
    </div>
  )
}
