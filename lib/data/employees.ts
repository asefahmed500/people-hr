import type { Department, ID } from "./types"

export type EmployeeStatus = "active" | "leave" | "remote"

export type Employee = {
  id: ID
  name: string
  email: string
  initials: string
  department: Department
  role: string
  location: string
  status: EmployeeStatus
  avatar?: string
  hiredDaysAgo: number
}

export const defaultEmployees: Employee[] = [
  {
    id: "e-sofia",
    name: "Sofia Alvarez",
    email: "sofia.alvarez@northwind.co",
    initials: "SA",
    department: "Design",
    role: "Product Designer",
    location: "Barcelona, ES",
    status: "active",
    hiredDaysAgo: 2,
  },
  {
    id: "e-daniel",
    name: "Daniel Okafor",
    email: "daniel.okafor@northwind.co",
    initials: "DO",
    department: "Engineering",
    role: "Backend Engineer",
    location: "Lagos, NG",
    status: "active",
    hiredDaysAgo: 3,
  },
  {
    id: "e-lena",
    name: "Lena Fischer",
    email: "lena.fischer@northwind.co",
    initials: "LF",
    department: "People",
    role: "HR Specialist",
    location: "Berlin, DE",
    status: "active",
    hiredDaysAgo: 5,
  },
  {
    id: "e-marcus",
    name: "Marcus Bailey",
    email: "marcus.bailey@northwind.co",
    initials: "MB",
    department: "Sales",
    role: "Account Executive",
    location: "London, UK",
    status: "leave",
    hiredDaysAgo: 220,
  },
  {
    id: "e-priya",
    name: "Priya Nair",
    email: "priya.nair@northwind.co",
    initials: "PN",
    department: "Engineering",
    role: "iOS Engineer",
    location: "Bangalore, IN",
    status: "remote",
    hiredDaysAgo: 410,
  },
  {
    id: "e-tomas",
    name: "Tomas Vidal",
    email: "tomas.vidal@northwind.co",
    initials: "TV",
    department: "Marketing",
    role: "Content Lead",
    location: "Lisbon, PT",
    status: "active",
    hiredDaysAgo: 320,
  },
  {
    id: "e-amara",
    name: "Amara Cole",
    email: "amara.cole@northwind.co",
    initials: "AC",
    department: "Research",
    role: "UX Researcher",
    location: "Toronto, CA",
    status: "active",
    hiredDaysAgo: 290,
  },
  {
    id: "e-hana",
    name: "Hana Lindqvist",
    email: "hana.lindqvist@northwind.co",
    initials: "HL",
    department: "Product",
    role: "Product Manager",
    location: "Stockholm, SE",
    status: "active",
    hiredDaysAgo: 700,
  },
]

export const newEmployee = (input: Omit<Employee, "id" | "initials" | "hiredDaysAgo">): Employee => ({
  ...input,
  id: `e-${Math.random().toString(36).slice(2, 9)}`,
  initials: input.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
  hiredDaysAgo: 0,
})
