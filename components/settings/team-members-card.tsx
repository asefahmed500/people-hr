"use client"

import * as React from "react"
import { Mail, MoreHorizontal, UserPlus } from "lucide-react"
import { z } from "zod"

import { notify } from "@/lib/toast"
import { apiRequest } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { DEPARTMENTS } from "@/lib/data/types"
import { ActionDialog } from "@/components/shared/dialog-parts"
import { Field, SelectField, useForm } from "@/components/shared/field"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Member = {
  id: string
  name: string
  email: string
  role: string
  initials: string
  department?: string | null
  managerId?: string | null
  joinedAt?: string
}

const inviteSchema = z.object({
  name: z.string().min(2, "Enter the member's name."),
  email: z.string().email("Enter a valid email."),
  role: z.string().min(1),
  department: z.string(),
})

export function TeamMembersCard() {
  const { user: me } = useAuth()
  const [members, setMembers] = React.useState<Member[]>([])
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [tempPassword, setTempPassword] = React.useState<string | null>(null)
  const form = useForm({ name: "", email: "", role: "employee", department: "" })

  const isAdmin = me?.role === "admin"

  const load = React.useCallback(async () => {
    try {
      setMembers(await apiRequest<Member[]>("/api/users"))
    } catch {
      setMembers([])
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) void load()
  }, [load, isAdmin])

  const handleInvite = async () => {
    const parsed = inviteSchema.safeParse(form.values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      form.setErrors(fieldErrors as never)
      return
    }
    setSubmitting(true)
    try {
      const res = await apiRequest<{ ok: boolean; member: Member; tempPassword: string; error?: string }>(
        "/api/users",
        { method: "POST", body: parsed.data },
      )
      if (!res.ok) throw new Error(res.error ?? "Could not add member.")
      setMembers((prev) => [...prev, res.member])
      setTempPassword(res.tempPassword)
      setInviteOpen(false)
      form.reset({ name: "", email: "", role: "employee", department: "" })
    } catch (err) {
      notify.error("Couldn’t add member", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleChange = async (m: Member, role: string) => {
    if (!isAdmin || m.role === role || m.id === me?.id) return
    try {
      await apiRequest(`/api/users/${m.id}`, { method: "PATCH", body: { role } })
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role } : x)))
      notify.success("Role updated", `${m.name} is now a ${role}.`)
    } catch (err) {
      notify.error("Couldn’t update role", err instanceof Error ? err.message : "Please try again.")
    }
  }

  const handleRemove = async () => {
    if (!removeTarget || !isAdmin) return
    setSubmitting(true)
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>(`/api/users/${removeTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(res.error ?? "Could not remove member.")
      setMembers((prev) => prev.filter((x) => x.id !== removeTarget.id))
      notify.success("Member removed", `${removeTarget.name} was removed from the workspace.`)
      setRemoveTarget(null)
    } catch (err) {
      notify.error("Couldn’t remove member", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
          Team members
        </span>
        <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-xs text-muted-foreground">
          Only admins can manage team members.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[15px] font-semibold leading-normal text-foreground">
          Team members
        </span>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border border-border bg-gradient-to-b from-white to-[#ececea] shadow-xs transition-colors hover:to-[#e2e2df]"
        >
          <UserPlus className="size-3.5 text-secondary-foreground" strokeWidth={2} />
          <span className="font-sans text-[12px] font-medium leading-normal text-secondary-foreground">
            Invite
          </span>
        </button>
      </div>
      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center font-sans text-xs text-muted-foreground">
          No team members yet — invite someone to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <span className="font-sans text-[12px] font-semibold text-primary">
                  {m.initials}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-sans text-[13px] font-medium leading-normal text-foreground">
                  {m.name}
                  {m.id === me?.id ? <span className="text-muted-foreground"> (you)</span> : null}
                </span>
                <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
                  {m.email}
                  {m.department ? ` · ${m.department}` : ""}
                </span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold capitalize",
                  m.role === "admin"
                    ? "bg-foreground/10 text-primary"
                    : m.role === "manager"
                      ? "bg-foreground/10 text-secondary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {m.role}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${m.name} options`}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                  >
                    <MoreHorizontal className="size-3.5" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`mailto:${m.email}`} className="flex items-center gap-2 font-sans text-[13px]">
                      <Mail className="size-3.5" /> Send email
                    </a>
                  </DropdownMenuItem>
                  {m.id !== me?.id && m.role !== "admin" && (
                    <DropdownMenuItem onClick={() => handleRoleChange(m, "admin")}>
                      Make admin
                    </DropdownMenuItem>
                  )}
                  {m.id !== me?.id && m.role !== "manager" && (
                    <DropdownMenuItem onClick={() => handleRoleChange(m, "manager")}>
                      Make manager
                    </DropdownMenuItem>
                  )}
                  {m.id !== me?.id && m.role !== "employee" && (
                    <DropdownMenuItem onClick={() => handleRoleChange(m, "employee")}>
                      Make employee
                    </DropdownMenuItem>
                  )}
                  {m.id !== me?.id ? (
                    <DropdownMenuItem
                      onClick={() => setRemoveTarget(m)}
                      className="font-sans text-[13px] text-foreground focus:text-foreground"
                    >
                      Remove from workspace
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <ActionDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite a team member"
        description="The member gets a temporary password you can share with them."
        submitLabel="Add member"
        submitting={submitting}
        onSubmit={handleInvite}
      >
        <Field label="Full name" value={form.values.name} onChange={(v) => form.setValue("name", v)} required error={form.errors.name} />
        <Field label="Work email" type="email" value={form.values.email} onChange={(v) => form.setValue("email", v)} required error={form.errors.email} />
        <SelectField
          label="Role"
          value={form.values.role}
          onChange={(v) => form.setValue("role", v)}
          options={[
            { value: "employee", label: "Employee" },
            { value: "manager", label: "Manager" },
            { value: "admin", label: "Admin" },
          ]}
          required
        />
        <SelectField
          label="Department"
          value={form.values.department}
          onChange={(v) => form.setValue("department", v)}
          options={[
            { value: "", label: "— Select department —" },
            ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
          ]}
        />
      </ActionDialog>

      <AlertDialog open={!!tempPassword} onOpenChange={(o) => !o && setTempPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Member added</AlertDialogTitle>
            <AlertDialogDescription>
              Share this temporary password with the new member so they can sign in:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg bg-muted px-4 py-3 text-center font-mono text-lg font-semibold text-foreground">
            {tempPassword}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTempPassword(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from the workspace. They can be invited back at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
