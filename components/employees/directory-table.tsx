import { Ellipsis, Filter, Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"

type Status = "active" | "leave" | "remote"

type Employee = {
  name: string
  email: string
  initials: string
  department: string
  role: string
  location: string
  status: Status
}

const employees: Employee[] = [
  {
    name: "Sofia Alvarez",
    email: "sofia.alvarez@northwind.co",
    initials: "SA",
    department: "Design",
    role: "Product Designer",
    location: "Barcelona, ES",
    status: "active",
  },
  {
    name: "Daniel Okafor",
    email: "daniel.okafor@northwind.co",
    initials: "DO",
    department: "Engineering",
    role: "Backend Engineer",
    location: "Lagos, NG",
    status: "active",
  },
  {
    name: "Lena Fischer",
    email: "lena.fischer@northwind.co",
    initials: "LF",
    department: "People",
    role: "HR Specialist",
    location: "Berlin, DE",
    status: "active",
  },
  {
    name: "Marcus Bailey",
    email: "marcus.bailey@northwind.co",
    initials: "MB",
    department: "Sales",
    role: "Account Executive",
    location: "London, UK",
    status: "leave",
  },
  {
    name: "Priya Nair",
    email: "priya.nair@northwind.co",
    initials: "PN",
    department: "Engineering",
    role: "iOS Engineer",
    location: "Bangalore, IN",
    status: "remote",
  },
  {
    name: "Tomas Vidal",
    email: "tomas.vidal@northwind.co",
    initials: "TV",
    department: "Marketing",
    role: "Content Lead",
    location: "Lisbon, PT",
    status: "active",
  },
  {
    name: "Amara Cole",
    email: "amara.cole@northwind.co",
    initials: "AC",
    department: "Research",
    role: "UX Researcher",
    location: "Toronto, CA",
    status: "active",
  },
  {
    name: "Hana Lindqvist",
    email: "hana.lindqvist@northwind.co",
    initials: "HL",
    department: "Product",
    role: "Product Manager",
    location: "Stockholm, SE",
    status: "active",
  },
]

const statusPill: Record<Status, { bg: string; text: string; dot: string }> = {
  active: {
    bg: "bg-[#3bb2731f]",
    text: "text-[#2e9160]",
    dot: "bg-[#3bb273]",
  },
  leave: {
    bg: "bg-[#f4a26129]",
    text: "text-[#c67934]",
    dot: "bg-[#f4a261]",
  },
  remote: {
    bg: "bg-[#64b6ac24]",
    text: "text-[#3e9488]",
    dot: "bg-[#64b6ac]",
  },
}

const statusLabel: Record<Status, string> = {
  active: "Active",
  leave: "On leave",
  remote: "Remote",
}

export function DirectoryTable() {
  return (
    <div className="flex w-full flex-col rounded-[18px] border border-[#ece9e2] bg-white shadow-[0px_1px_3px_rgba(31,42,38,0.04),0px_8px_24px_rgba(31,42,38,0.03)]">
      <Toolbar />
      <HeaderRow />
      <div className="flex flex-col">
        {employees.map((employee) => (
          <EmployeeRow key={employee.email} employee={employee} />
        ))}
      </div>
      <Footer />
    </div>
  )
}

function Toolbar() {
  return (
    <div className="flex w-full items-center justify-between gap-4 border-b border-b-[#edeae3] px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-[264px] items-center gap-2 rounded-xl bg-[#f5f3ee] px-3.5">
          <Search className="size-4 shrink-0 text-[#a2aaa3]" strokeWidth={2} />
          <span className="font-sans text-[13px] leading-normal text-[#9aa39c]">
            Search by name, role, email…
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-[11px] bg-[#f1efea] p-1">
          <Tab label="All" count="1,284" active />
          <Tab label="Active" />
          <Tab label="On leave" />
          <Tab label="Contractors" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ToolbarButton icon={SlidersHorizontal} label="Sort" />
        <ToolbarButton icon={Filter} label="Filter" />
        <div className="flex items-center gap-1 rounded-[10px] bg-[#f1efea] p-1">
          <button
            type="button"
            aria-label="List view"
            className="flex size-[30px] items-center justify-center rounded-[7px] bg-white shadow-sm"
          >
            <List className="size-4 text-[#2f6f61]" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            className="flex size-[30px] items-center justify-center rounded-[7px]"
          >
            <LayoutGrid className="size-4 text-[#8a948d]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Tab({
  label,
  count,
  active = false,
}: {
  label: string
  count?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-lg px-3 py-0",
        active ? "bg-white shadow-sm" : "",
      )}
    >
      <span
        className={cn(
          "font-sans text-[12.5px] leading-normal",
          active
            ? "font-semibold text-[#1f2a26]"
            : "font-medium text-[#6b7770]",
        )}
      >
        {label}
      </span>
      {count ? (
        <span className="font-sans text-[11.5px] font-medium leading-normal text-[#8a948d]">
          {count}
        </span>
      ) : null}
    </button>
  )
}

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: typeof Filter
  label: string
}) {
  return (
    <button
      type="button"
      className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#e7e4dd] bg-white px-3.5"
    >
      <Icon className="size-4 text-[#5b655e]" strokeWidth={2} />
      <span className="font-sans text-[13px] font-medium leading-normal text-[#42504a]">
        {label}
      </span>
    </button>
  )
}

function HeaderRow() {
  const headers = [
    { label: "Employee", className: "min-w-0 flex-1" },
    { label: "Department", className: "w-[150px] shrink-0" },
    { label: "Role", className: "w-[200px] shrink-0" },
    { label: "Location", className: "w-[150px] shrink-0" },
    { label: "Status", className: "w-[120px] shrink-0" },
  ]
  return (
    <div className="flex w-full items-center border-b border-b-[#edeae3] bg-[#faf9f6] px-6 py-3">
      {headers.map((h) => (
        <div
          key={h.label}
          className={cn(
            "font-sans text-[11px] font-semibold uppercase leading-normal tracking-[0.6px] text-[#8a948d]",
            h.className,
          )}
        >
          {h.label}
        </div>
      ))}
      <div className="flex w-10 shrink-0 flex-col" />
    </div>
  )
}

function EmployeeRow({ employee }: { employee: Employee }) {
  const pill = statusPill[employee.status]
  return (
    <div className="flex w-full items-center border-b border-b-[#f2efe9] px-6 py-3.5 transition-colors hover:bg-[#faf9f6]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#64b6ac29]">
          <span className="font-sans text-[12.5px] font-semibold leading-normal text-[#3e9488]">
            {employee.initials}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-sans inline-block overflow-clip text-sm font-semibold leading-tight text-[#1f2a26] [text-overflow:ellipsis]">
            {employee.name}
          </span>
          <span className="font-sans inline-block overflow-clip text-[12.5px] leading-tight text-[#9aa39c] [text-overflow:ellipsis]">
            {employee.email}
          </span>
        </div>
      </div>
      <div className="flex w-[150px] shrink-0 flex-col">
        <span className="inline-block w-fit rounded-full bg-[#f1efea] px-2.5 py-1 font-sans text-[11.5px] font-medium leading-normal text-[#5b655e]">
          {employee.department}
        </span>
      </div>
      <div className="w-[200px] shrink-0 font-sans text-[13.5px] leading-normal text-[#42504a]">
        {employee.role}
      </div>
      <div className="w-[150px] shrink-0 font-sans text-[13.5px] leading-normal text-[#6b7770]">
        {employee.location}
      </div>
      <div className="flex w-[120px] shrink-0 flex-col">
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-semibold leading-normal",
            pill.bg,
            pill.text,
          )}
        >
          <span className={cn("size-1.5 rounded-full", pill.dot)} />
          {statusLabel[employee.status]}
        </span>
      </div>
      <div className="flex w-10 shrink-0 justify-end">
        <button
          type="button"
          aria-label={`More options for ${employee.name}`}
          className="flex size-[18px] items-center justify-center"
        >
          <Ellipsis className="size-[18px] text-[#b0b7af]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="flex w-full items-center justify-between border-t border-t-[#edeae3] bg-[#faf9f6] px-6 py-4">
      <span className="font-sans inline-block text-[13px] leading-normal text-[#6b7770]">
        Showing 1–8 of 1,284 employees
      </span>
      <div className="flex items-center gap-1.5">
        <PagerButton>
          <ChevronLeft />
        </PagerButton>
        <PagerButton active>1</PagerButton>
        <PagerButton>2</PagerButton>
        <PagerButton>3</PagerButton>
        <span className="font-sans px-1 py-0 text-[13px] leading-normal text-[#b0b7af]">
          …
        </span>
        <PagerButton>161</PagerButton>
        <PagerButton>
          <ChevronRight />
        </PagerButton>
      </div>
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M15 6l-6 6l6 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  )
}

function PagerButton({
  children,
  active = false,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-[34px] items-center justify-center rounded-[9px] font-sans text-[13px] leading-normal",
        active
          ? "bg-[#2f6f61] font-semibold text-white"
          : "border border-[#e7e4dd] bg-white font-medium text-[#42504a]",
      )}
    >
      {children}
    </button>
  )
}
