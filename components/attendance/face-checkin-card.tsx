"use client"

import * as React from "react"
import { Camera, CameraOff, CheckCircle2, Clock, RefreshCw, ScanFace, ShieldQuestion, XCircle, type LucideIcon } from "lucide-react"

import { captureDescriptor, prepareFaceEngine, startCamera } from "@/lib/face-client"
import { apiRequest, ApiError } from "@/lib/api-client"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type EnrollmentStatus = "none" | "pending" | "approved" | "rejected"

type FaceCheckinCardProps = {
  /** Time the caller already checked in today, or null. */
  alreadyCheckedInTime: string | null
  /** Called after a successful face check-in so the parent can refresh. */
  onCheckedIn?: () => void
}

type Phase = "idle" | "camera" | "processing"

export function FaceCheckinCard({ alreadyCheckedInTime, onCheckedIn }: FaceCheckinCardProps) {
  const [status, setStatus] = React.useState<EnrollmentStatus | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [modelsReady, setModelsReady] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const stopCameraRef = React.useRef<(() => void) | null>(null)

  const refreshStatus = React.useCallback(async () => {
    try {
      const res = await apiRequest<{ status: EnrollmentStatus }>("/api/attendance/face")
      setStatus(res.status)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't load your face registration status.")
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiRequest<{ status: EnrollmentStatus }>("/api/attendance/face")
        if (!cancelled) {
          setStatus(res.status)
          setLoadError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : "Couldn't load your face registration status.",
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const stopCamera = React.useCallback(() => {
    stopCameraRef.current?.()
    stopCameraRef.current = null
    setPhase("idle")
  }, [])

  React.useEffect(() => () => stopCameraRef.current?.(), [])

  async function openCamera() {
    const video = videoRef.current
    if (!video) return
    setPhase("camera")
    setLoadError(null)
    try {
      setModelsReady(false)
      await prepareFaceEngine()
      setModelsReady(true)
      stopCameraRef.current = await startCamera(video)
    } catch (err) {
      stopCamera()
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        notify.error("Camera blocked", "Allow camera access in your browser to use face check-in.")
      } else {
        notify.error("Couldn't start the camera", "Close other apps using the camera and try again.")
      }
    }
  }

  async function submit(kind: "enroll" | "checkin") {
    const video = videoRef.current
    if (!video) return
    setPhase("processing")
    try {
      const capture = await captureDescriptor(video)
      if (!capture.ok) {
        setPhase("camera")
        notify.error(
          capture.error === "no-face" ? "No face detected" : "Multiple faces detected",
          capture.error === "no-face"
            ? "Center your face in the frame with good lighting, then capture again."
            : "Only one person should be in the frame during capture.",
        )
        return
      }
      if (kind === "enroll") {
        const res = await apiRequest<{ status: EnrollmentStatus }>("/api/attendance/face", {
          method: "POST",
          body: { descriptor: capture.descriptor },
        })
        setStatus(res.status)
        notify.success("Face registered", "An admin will review and approve your registration.")
        stopCamera()
      } else {
        const res = await apiRequest<{ checkIn: { name: string; time: string; status: string } }>(
          "/api/attendance/face/checkin",
          { method: "POST", body: { descriptor: capture.descriptor } },
        )
        notify.success(
          `Checked in at ${res.checkIn.time}`,
          `Welcome, ${res.checkIn.name} Ã¢â‚¬â€ recorded as ${res.checkIn.status.replace("-", " ")}.`,
        )
        stopCamera()
        onCheckedIn?.()
      }
    } catch (err) {
      setPhase("camera")
      const message = err instanceof ApiError ? err.message : "Something went wrong. Try again."
      notify.error(kind === "enroll" ? "Registration failed" : "Check-in failed", message)
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
        void refreshStatus()
      }
    }
  }

  const statusChip = (s: EnrollmentStatus): { icon: LucideIcon; label: string; variant: "secondary" | "outline" | "destructive" } => {
    switch (s) {
      case "approved":
        return { icon: CheckCircle2, label: "Registered", variant: "secondary" }
      case "pending":
        return { icon: Clock, label: "Awaiting approval", variant: "outline" }
      case "rejected":
        return { icon: XCircle, label: "Rejected", variant: "destructive" }
      default:
        return { icon: ShieldQuestion, label: "Not registered", variant: "secondary" }
    }
  }

  const s = status ? statusChip(status) : null
  const captureKind: "enroll" | "checkin" = status === "approved" ? "checkin" : "enroll"

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 flex items-center gap-2">
            <ScanFace className="size-4.5 text-primary" strokeWidth={2} aria-hidden="true" />
            Face check-in
          </h3>
          <span className="font-sans inline-block text-[12px] leading-normal text-muted-foreground">
            Check in with your face Ã¢â‚¬â€ attendance identity is verified server-side, never self-reported.
          </span>
        </div>
        {s ? (
          <Badge variant={s.variant} className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
            <s.icon className="size-3" aria-hidden="true" />
            {s.label}
          </Badge>
        ) : null}
      </div>

      {loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <span className="font-sans text-[12.5px] text-destructive">{loadError}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshStatus()}
            className="shrink-0 font-sans text-[12px] font-medium"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Retry
          </Button>
        </div>
      ) : null}

      {status === "pending" ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3">
          <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="font-sans text-[12.5px] text-secondary-foreground">
            Your registration is waiting for an admin to approve it. You&apos;ll be able to check in once approved.
          </span>
        </div>
      ) : null}

      {/* Camera stage: mounted for the card's whole lifetime so the video
          element exists the moment a button is clicked (a lazily-mounted ref
          is null at click time and silently no-ops the handler). Hidden
          whenever the flow isn't active. */}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-foreground",
          phase === "idle" && "hidden",
        )}
      >
        <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
        {phase === "processing" || !modelsReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="font-sans text-[12.5px] font-medium text-white">
              {phase === "processing" ? "RecognizingÃ¢â‚¬Â¦" : "Loading face model (first time only)Ã¢â‚¬Â¦"}
            </span>
          </div>
        ) : null}
      </div>

      {phase === "idle" ? (
        <div className="flex flex-col gap-3">
          {status === "approved" && !alreadyCheckedInTime ? (
            <Button
              type="button"
              onClick={() => void openCamera()}
              className="h-9 font-sans text-[14px] font-medium"
            >
              <ScanFace className="size-4" aria-hidden="true" />
              Scan my face to check in
            </Button>
          ) : null}
          {(status === "none" || status === "rejected") && !alreadyCheckedInTime ? (
            <Button
              type="button"
              onClick={() => void openCamera()}
              className="h-9 font-sans text-[14px] font-medium"
            >
              <Camera className="size-4" aria-hidden="true" />
              {status === "rejected" ? "Register again" : "Register your face"}
            </Button>
          ) : null}
          {status === "approved" ? (
            <span className="font-sans text-[11.5px] leading-normal text-muted-foreground">
              Your face is locked to your account. To change it, ask an admin to reset your registration.
            </span>
          ) : null}
          {alreadyCheckedInTime ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-3">
              <span className="flex items-center gap-2 font-sans text-[12.5px] text-secondary-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                You already checked in today at {alreadyCheckedInTime}.
              </span>
              <span className="shrink-0 font-sans text-[11px] text-muted-foreground">
                One check-in per day
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={phase === "processing"}
            onClick={() => void submit(captureKind)}
            className="h-9 flex-1 font-sans text-[13px] font-medium disabled:opacity-60"
          >
            <ScanFace className="size-4" aria-hidden="true" />
            {captureKind === "checkin" ? "Capture & check in" : "Capture & register"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={phase === "processing"}
            onClick={stopCamera}
            className="h-9 px-4 font-sans text-[13px] font-medium disabled:opacity-60"
          >
            <CameraOff className="size-4" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
