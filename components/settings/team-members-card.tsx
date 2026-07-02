"use client"

import { Mail, MoreHorizontal, UserPlus } from "lucide-react"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const members = [
  { initials: "AA", name: "Asef Ahmed", role: "Admin", email: "asef@northwind.co" },
  { initials: "SA", name: "Sofia Alvarez", role: "Member", email: "sofia@northwind.co" },
  { initials: "DO", name: "Daniel Okafor", role: "Member", email: "daniel@northwind.co" },
  { initials: "PN", name: "Priya Nair", role: "Member", email: "priya@northwind.co" },
  { initials: "HL", name: "Hana Lindqvist", role: "Member", email: "hana@northwind.co" },
]

export function TeamMembersCard() {
  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#e8ebe6] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[15px] font-semibold leading-normal text-[#1f2a26]">
          Team members
        </span>
        <button
          type="button"
          onClick={() => notify.info("Invite member dialog coming soon")}
          className="flex items-center gap-1.5 rounded-lg bg-[#2f6f61] px-3 py-1.5"
        >
          <UserPlus className="size-3.5 text-white" strokeWidth={2} />
          <span className="font-sans text-[12px] font-semibold leading-normal text-white">
            Invite
          </span>
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m.email}
            className="flex items-center gap-3 rounded-xl border border-[#edeae3] bg-[#faf9f6] p-3"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2f6f611f]">
              <span className="font-sans text-[12px] font-semibold text-[#2f6f61]">
                {m.initials}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-sans text-[13px] font-medium leading-normal text-[#1f2a26]">
                {m.name}
              </span>
              <span className="font-sans text-[11.5px] leading-normal text-[#8a948d]">
                {m.email}
              </span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold",
                m.role === "Admin"
                  ? "bg-[#2f6f611a] text-[#2f6f61]"
                  : "bg-[#f1eee8] text-[#5b655e]",
              )}
            >
              {m.role}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${m.name} options`}
                  className="flex size-7 items-center justify-center rounded-md text-[#8a948d] hover:bg-[#f1eee8]"
                >
                  <MoreHorizontal className="size-3.5" strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => notify.info(`Emailing ${m.name}`)}>
                  <Mail className="mr-2 size-3.5" /> Send email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => notify.info(`Role management for ${m.name}`)}>
                  Change role
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => notify.info(`Remove ${m.name} from workspace`)}
                  className="text-[#c4553a]"
                >
                  Remove from workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}
