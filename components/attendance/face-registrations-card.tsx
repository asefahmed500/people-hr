"use client"

import * as React from "react"
import { Check, RotateCcw, ScanFace, X } from "lucide-react"

import { apiRequest, ApiError } from "@/lib/api-client"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { notify } from "@/lib/toast"

type Enrollment = {
  userId: string
  userName: string
  department: string | null
  active: boolean
  status: "pending" | "approved" | "rejected"
  enrolledAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
}

const statusVariant: Record<Enrollment["status"], "secondary" | "outline" | "destructive"> = {
  approved: "secondary",
  pending: "outline",
  rejected: "destructive",
}

/** Admin panel: approve / reject / reset employee face registrations. */
export function FaceRegistrationsCard({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = React.useState<Enrollment[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [resetTarget, setResetTarget] = React.useState<Enrollment | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await apiRequest<{ enrollments: Enrollment[] }>("/api/attendance/face?all=1")
      setItems(res.enrollments)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load face registrations.")
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiRequest<{ enrollments: Enrollment[] }>("/api/attendance/face?all=1")
        if (!cancelled) {
          setItems(res.enrollments)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load face registrations.")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function act(userId: string, action: "approve" | "reject") {
    setBusyId(userId)
    try {
      await apiRequest("/api/attendance/face", { method: "PATCH", body: { userId, action } })
      notify.success(
        action === "approve" ? "Registration approved" : "Registration rejected",
        "The employee's face status has been updated.",
      )
      await load()
      onChanged?.()
    } catch (err) {
      notify.error("Couldn't update", err instanceof ApiError ? err.message : "Try again.")
    } finally {
      setBusyId(null)
    }
  }

  async function reset(userId: string) {
    setBusyId(userId)
    try {
      await apiRequest("/api/attendance/face", { method: "PATCH", body: { userId, action: "reset" } })
      notify.success("Registration reset", "The employee can register their face again.")
      setResetTarget(null)
      await load()
      onChanged?.()
    } catch (err) {
      notify.error("Couldn't reset", err instanceof ApiError ? err.message : "Try again.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <ScanFace className="size-4.5 text-primary" strokeWidth={2} aria-hidden="true" />
          <h3 className="text-h4">Face registrations</h3>
        </div>
        <span className="font-sans text-[12px] leading-normal text-muted-foreground">
          Employees register their own face; nothing becomes usable for check-ins until you approve it. Reset lets someone re-register (e.g. after a camera change).
        </span>

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <span className="font-sans text-[12.5px] text-destructive">{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              className="font-sans text-[12px] font-medium"
            >
              Retry
            </Button>
          </div>
        ) : null}

        {items === null && !error ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : null}

        {items?.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center">
            <ScanFace className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={2} />
            <p className="font-sans text-[13px] font-semibold text-foreground">No face registrations yet</p>
            <p className="font-sans text-[12.5px] leading-normal text-muted-foreground">
              Employees register from the face check-in card above.
            </p>
          </div>
        ) : null}

        {items && items.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {items.map((e) => (
              <div key={e.userId} className="flex items-center gap-3 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-sans text-[13px] font-medium text-foreground">
                    {e.userName}
                    {!e.active ? " · inactive" : ""}
                  </span>
                  <span className="font-sans text-[11.5px] text-muted-foreground">
                    {e.department ?? "No department"}
                    {e.enrolledAt ? ` · registered ${new Date(e.enrolledAt).toLocaleDateString()}` : ""}
                  </span>
                </div>
                <Badge variant={statusVariant[e.status]} className="shrink-0 text-[11px] font-semibold">
                  {e.status === "approved" ? "Approved" : e.status === "pending" ? "Pending" : "Rejected"}
                </Badge>
                <div className="flex shrink-0 items-center gap-1">
                  {e.status !== "approved" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={busyId === e.userId || !e.active}
                          onClick={() => void act(e.userId, "approve")}
                          aria-label={`Approve ${e.userName}'s face registration`}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Approve</TooltipContent>
                    </Tooltip>
                  ) : null}
                  {e.status !== "rejected" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={busyId === e.userId}
                          onClick={() => void act(e.userId, "reject")}
                          aria-label={`Reject ${e.userName}'s face registration`}
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject</TooltipContent>
                    </Tooltip>
                  ) : null}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={busyId === e.userId}
                        onClick={() => setResetTarget(e)}
                        aria-label={`Reset ${e.userName}'s face registration`}
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset (allow re-registration)</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <ConfirmDialog
          open={!!resetTarget}
          onOpenChange={(o) => {
            if (!o) setResetTarget(null)
          }}
          title="Reset face registration?"
          description={
            resetTarget
              ? `Delete ${resetTarget.userName}'s stored face so they can register again. Their check-in history is not affected.`
              : undefined
          }
          confirmLabel="Reset"
          destructive
          onConfirm={() => {
            if (resetTarget) void reset(resetTarget.userId)
          }}
        />
      </div>
    </TooltipProvider>
  )
}
